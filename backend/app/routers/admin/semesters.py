from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import date
from ... import schemas
from ...database import get_db
from sqlalchemy.orm import joinedload
from ...models import Semester, SemesterStatus, CourseOffering, Enrollment, Student, StudentStatus, Teacher, Course
from .dependencies import require_admin

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_active_semester(db: Session) -> Semester | None:
    # Returns the currently active semester, or None if none is active
    return db.execute(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).scalars().first()


def get_last_completed_semester(db: Session) -> Semester:
    # Returns the most recent completed semester ordered by year then number
    semester = db.execute(
        select(Semester)
        .where(Semester.status == SemesterStatus.completed)
        .order_by(Semester.academic_year_start.desc(), Semester.number.desc())
    ).scalars().first()

    if not semester:
        raise HTTPException(
            status_code=404,
            detail="No completed semester found to advance from."
        )

    return semester


def create_semester(db: Session, last: Semester) -> Semester:
    # Creates the next semester in sequence as upcoming, rolling over year if needed
    next_number = last.number + 1 if last.number < 3 else 1
    next_year_start = last.academic_year_start if next_number > 1 else last.academic_year_start + 1
    next_year_end = last.academic_year_end if next_number > 1 else last.academic_year_end + 1

    new_semester = Semester(
        number=next_number,
        academic_year_start=next_year_start,
        academic_year_end=next_year_end,
        status=SemesterStatus.upcoming,
    )
    db.add(new_semester)
    db.flush()
    return new_semester


def duplicate_offerings(db: Session, last: Semester, new_semester_id: int) -> None:
    # Copies all course offerings from the last semester into the new one
    previous_offerings = db.execute(
        select(CourseOffering).where(CourseOffering.semester_id == last.id)
    ).scalars().all()
    
    if not previous_offerings:
        raise HTTPException(
            status_code=404,
            detail=f"No course offerings found for semester {last.number} "
                f"({last.academic_year_start}/{last.academic_year_end})."
        )
        
    for offering in previous_offerings:
        new_offering = CourseOffering(
            course_id=offering.course_id,
            section_id=offering.section_id,
            teacher_id=offering.teacher_id,
            semester_id=new_semester_id,
        )
        db.add(new_offering)

    db.flush()


def enroll_students(db: Session, new_semester_id: int) -> None:
    # Enrolls all students into the new semester's offerings, grouped by section
    new_offerings = db.execute(
        select(CourseOffering).where(CourseOffering.semester_id == new_semester_id)
    ).scalars().all()

    offerings_by_section: dict[int, list[CourseOffering]] = {}
    for offering in new_offerings:
        offerings_by_section.setdefault(offering.section_id, []).append(offering)

    for section_id, section_offerings in offerings_by_section.items():
        students = db.execute(
            select(Student).where(Student.section_id == section_id, Student.status == StudentStatus.active)
        ).scalars().all() 
        for student in students:
            for offering in section_offerings:
                enrollment = Enrollment(
                    student_id=student.id,
                    course_offering_id=offering.id,
                    enrollment_date=date.today(),
                    status="active",
                )
                db.add(enrollment)

    db.flush()


def activate_semester(db: Session, new_semester: Semester) -> None:
    # Sets the new semester status from upcoming to current
    new_semester.status = SemesterStatus.current
    db.add(new_semester)
    db.flush()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/semesters', response_model=List[schemas.SemesterOut])
def get_semesters(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    semesters = db.execute(select(Semester)).scalars().all()
    return semesters


@router.post("/semesters/end", response_model=schemas.SemesterOut)
def end_semester(db: Session = Depends(get_db)):
    semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
    if not semester:
        raise HTTPException(status_code=404, detail="No active semester found")



    # Find all course offerings that still have active enrollments
    active_offerings = db.execute(
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(
            CourseOffering.semester_id == semester.id,
            CourseOffering.id.in_(
                select(Enrollment.course_offering_id)
                .where(Enrollment.status == "active")
                .distinct()
            )
        )
    ).scalars().all()
    
    

    if active_offerings:
        pending = [
            f"- {co.course.name} "
            f"(Section {co.section.grade}{co.section.name}) "
            f"— {co.teacher.user.first_name} {co.teacher.user.last_name}"
            for co in active_offerings
        ]
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot end semester. The following course offerings still have uncommitted marks:\n"
                + "\n".join(pending)
            )
        )

    completed_enrollment = db.execute(
    select(Enrollment)
    .join(CourseOffering, Enrollment.course_offering_id == CourseOffering.id)
    .where(
        CourseOffering.semester_id == semester.id,
        Enrollment.status == "completed"
    )
).scalars().first()

    if not completed_enrollment:
        raise HTTPException(status_code=400, detail="Cannot end semester with no completed enrollments")
    
    semester.status = SemesterStatus.completed
    db.commit()
    db.refresh(semester)

    return semester

@router.post("/semesters/advance", response_model=schemas.SemesterOut)
def advance_semester(db: Session = Depends(get_db)):
    # Advances from the last completed semester to the next one within the same academic year
    if get_active_semester(db):
        raise HTTPException(
            status_code=400,
            detail="Cannot advance: a semester is currently active. Complete it first."
        )

    last = get_last_completed_semester(db)

    if last.number >= 3:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Semester {last.number} is the last semester of academic year "
                f"{last.academic_year_start}/{last.academic_year_end}. "
                "Please trigger a new academic year migration instead."
            )
        )

    try:
        new_semester = create_semester(db, last)
        duplicate_offerings(db, last, new_semester.id)
        enroll_students(db, new_semester.id)
        activate_semester(db, new_semester)
        db.commit()
    except HTTPException:
        db.rollback()
        raise 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return new_semester




