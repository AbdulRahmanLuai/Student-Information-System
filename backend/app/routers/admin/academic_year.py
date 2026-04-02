from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from app import schemas
from app.database import get_db
from collections import defaultdict
from app.models import (
    Semester, Section, Student, Teacher, Course,
    AcademicYearSetup, SetupSection, SetupCourseOffering, SemesterStatus, CourseStatus, StudentStatus, CourseOffering, Enrollment
)
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/academic-year")


MAX_SEMESTERS_PER_YEAR = 3
FINAL_GRADE = 12

# --- Helper Functions ---------------------------------------------------------------------------------

def get_last_semester(db: Session) -> Semester:
    semester = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.completed)
        .order_by(Semester.academic_year_start.desc(), Semester.number.desc())
    ).first()

    if not semester:
        raise HTTPException(404, "No semesters found")

    return semester


def ensure_no_active_setup(db: Session):
    existing = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="An academic year setup is already in progress"
        )
        
def create_academic_year_setup(db: Session, new_year: int) -> AcademicYearSetup:
    setup = AcademicYearSetup(
        academic_year_start=new_year,
        status="draft",
        created_at=datetime.utcnow()
    )
    db.add(setup)
    db.flush()
    return setup

def generate_setup_sections(
    db: Session,
    setup: AcademicYearSetup,
    current_year: int
):
    current_sections = db.exec(
        select(Section).where(Section.academic_year_start == current_year)
    ).all()

    if not current_sections:
        raise HTTPException(400, "No sections found for current academic year")
    for section in current_sections:
        
        if section.grade == FINAL_GRADE:
            continue
            

        
        student_count = db.exec(
            select(func.count(Student.id)).where(
                Student.section_id == section.id,
                Student.status == StudentStatus.active
            )
        ).one()

    

        setup_section = SetupSection(
            setup_id=setup.id,
            name=section.name,
            grade=section.grade + 1,
            student_count=student_count,
            is_configured=False
        )
        db.add(setup_section)
        db.flush()

        create_section_course_templates(db, setup_section)
        

def create_section_course_templates(
    db: Session,
    setup_section: SetupSection
):
    courses = db.exec(
        select(Course).where(
            Course.grade == setup_section.grade,
            Course.status == CourseStatus.active
        )
    ).all()

    if not courses:
        raise HTTPException(
            status_code=400,
            detail=f"No active courses found for grade {setup_section.grade}"
        )

    for course in courses:
        setup_course = SetupCourseOffering(
            setup_section_id=setup_section.id,
            course_id=course.id,
            teacher_id=None
        )
        db.add(setup_course)
        
def ensure_no_current_semester(db: Session):
    current = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).first()

    if current:
        raise HTTPException(
            status_code=400,
            detail="Cannot start migration while a semester is active"
        )
        
        
def ensure_last_semester_was_final_semester(semester):
    if semester.number != MAX_SEMESTERS_PER_YEAR:
        raise HTTPException(status_code=400, detail="Cannot start migration until the last semester of the academic year is completed")



def get_active_setup(db: Session) -> AcademicYearSetup:
    setup = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if not setup:
        raise HTTPException(404, "No active academic year setup found")

    return setup



def validate_commit_preconditions(db: Session) -> tuple[AcademicYearSetup, list[SetupSection]]:
    setup = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if not setup:
        raise HTTPException(400, "No active academic year setup found")

    setup_sections = db.exec(
        select(SetupSection).where(SetupSection.setup_id == setup.id)
    ).all()

    if not setup_sections:
        raise HTTPException(400, "No setup sections found")

    if not all(s.is_configured for s in setup_sections):
        raise HTTPException(400, "All sections must be configured before commit")

    current_semester = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).first()

    if current_semester:
        raise HTTPException(400, "Cannot commit while a semester is active")

    return setup, setup_sections


def create_new_semester(db: Session, setup: AcademicYearSetup) -> Semester:
    semester = Semester(
        academic_year_start=setup.academic_year_start,
        academic_year_end=setup.academic_year_start + 1,
        number=1,
        status=SemesterStatus.current
    )
    db.add(semester)
    db.flush()
    print(semester, "this was created")
    return semester


def create_sections(db: Session, setup: AcademicYearSetup, setup_sections: list[SetupSection]):
    new_section_map = {}

    for s in setup_sections:
        new_section = Section(
            grade=s.grade,
            name=s.name,
            academic_year_start=setup.academic_year_start
        )
        db.add(new_section)
        db.flush()

        key = (s.grade, s.name)
        if key in new_section_map:
            raise HTTPException(400, f"Duplicate section {key}")

        new_section_map[key] = new_section

    return new_section_map

def promote_students(db: Session, setup: AcademicYearSetup, new_section_map):
    previous_year = setup.academic_year_start - 1

    old_sections = db.exec(
        select(Section).where(Section.academic_year_start == previous_year)
    ).all()

    old_section_map = {(s.grade, s.name): s for s in old_sections}

    students = db.exec(
        select(Student).where(Student.status == StudentStatus.active)
    ).all()

    section_students_map = defaultdict(list)
    for student in students:
        section_students_map[student.section_id].append(student)

    for (grade, name), old_section in old_section_map.items():
        
        if grade == FINAL_GRADE:
            
            # graduate students instead of promoting them
            for student in section_students_map.get(old_section.id, []):
                student.section_id = None
                student.status = StudentStatus.graduated
                db.add(student)
            continue

        new_key = (grade + 1, name)
        new_section = new_section_map.get(new_key)

        if not new_section:
            raise HTTPException(
                500,
                f"Missing new section for {(grade+1, name)}"
            )

        for student in section_students_map.get(old_section.id, []):
            student.section_id = new_section.id
            db.add(student)
            
            
def create_course_offerings(db: Session, setup: AcademicYearSetup, setup_sections, new_section_map, semester: Semester):
    setup_courses = db.exec(
        select(SetupCourseOffering)
        .join(SetupSection, SetupCourseOffering.setup_section_id == SetupSection.id)
        .where(SetupSection.setup_id == setup.id)
    ).all()

    setup_section_map = {s.id: s for s in setup_sections}

    for sc in setup_courses:
        setup_section = setup_section_map.get(sc.setup_section_id)

        if not setup_section:
            raise HTTPException(500, "Invalid setup data")

        new_section = new_section_map.get(
            (setup_section.grade, setup_section.name)
        )

        if not new_section:
            raise HTTPException(500, "Section mapping failed")

        db.add(CourseOffering(
            course_id=sc.course_id,
            section_id=new_section.id,
            semester_id=semester.id,
            teacher_id=sc.teacher_id
        ))
        
        
def check_valid_enrollment_state(db: Session) -> bool:
    # 1. No active (draft) setup
    active_setup = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if active_setup:
        return False

    # 2. Current semester must exist
    current_semester = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).first()

    if not current_semester:
        return False

    # 3. Must be first semester of academic year
    if current_semester.number != 1:
        return False

    # 4. A completed setup must exist for this academic year
    completed_setup = db.exec(
        select(AcademicYearSetup).where(
            AcademicYearSetup.status == "completed",
            AcademicYearSetup.academic_year_start == current_semester.academic_year_start
        )
    ).first()

    if not completed_setup:
        return False, None

    return True, current_semester



# --- Endpoints -----------------------------------------------------------------------------------------

@router.post("/start")
def start_academic_year_migration(db: Session = Depends(get_db)):
    
    ensure_no_current_semester(db)
    ensure_no_active_setup(db)
    last_semester = get_last_semester(db)
    ensure_last_semester_was_final_semester(last_semester)
    
    new_year = last_semester.academic_year_start + 1
    

    try:        
        setup = create_academic_year_setup(db, new_year)
        generate_setup_sections(db, setup, last_semester.academic_year_start)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(e, "check")
        raise HTTPException(500, "Internal server error")
            
    return {"academicyearsetup_id": setup.id}


@router.delete("/reset")
def reset_academic_year_setup(db: Session = Depends(get_db)):
    drafts = db.exec(select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")).all()
    
    if not drafts:
        raise HTTPException(status_code=404, detail="No draft setup found")
    
    for draft in drafts:
        db.delete(draft)
    
    db.commit()
    return {"message": "Draft setup reset successfully"}


@router.get("/sections", response_model=list[schemas.SetupSectionPreview])
def get_setup_sections(db: Session = Depends(get_db)):

    setup = get_active_setup(db)

    sections = db.exec(
        select(SetupSection).where(SetupSection.setup_id == setup.id)
    ).all()

    result = []

    for s in sections:
        result.append(
            schemas.SetupSectionPreview(
                id=s.id,
                section=f"{s.grade}{s.name}",
                student_count=s.student_count,
                is_configured=s.is_configured
            )
        )

    return result


@router.get("/sections/{section_id}", response_model=schemas.SetupSectionDetail)
def get_section_detail(section_id: int, db: Session = Depends(get_db)):

    # 🔵 1. Get setup section
    setup_section = db.get(SetupSection, section_id)

    if not setup_section:
        raise HTTPException(404, "Setup section not found")

    # 🔵 2. Get all setup course offerings
    setup_courses = db.exec(
        select(SetupCourseOffering).where(
            SetupCourseOffering.setup_section_id == section_id
        )
    ).all()

    if not setup_courses:
        raise HTTPException(400, "No courses found for this section")

    # 🔵 3. Get all courses in one query
    course_ids = [sc.course_id for sc in setup_courses]

    courses = db.exec(
        select(Course).where(Course.id.in_(course_ids))
    ).all()

    course_map = {c.id: c for c in courses}

    # 🔵 4. Get all teachers (once)
    teachers = db.exec(
        select(Teacher).options(selectinload(Teacher.user))
    ).all()
    # 🔵 5. Group teachers by department
    teachers_by_dept = {}
    for t in teachers:
        if t.department_id not in teachers_by_dept:
            teachers_by_dept[t.department_id] = []

        teachers_by_dept[t.department_id].append(
            schemas.TeacherOption(
                id=t.id,
                name=f"{t.user.first_name} {t.user.last_name}"
            )
        )

    # 🔵 6. Build response
    course_items = []

    for sc in setup_courses:
        course = course_map.get(sc.course_id)

        if not course:
            raise HTTPException(
                500,
                f"Inconsistent data: course {sc.course_id} not found"
            )

        dept_teachers = teachers_by_dept.get(course.department_id, [])

        course_items.append(
            schemas.SetupCourseItem(
                setup_course_id=sc.id,
                course_id=course.id,
                course_name=course.name,
                teacher_id=sc.teacher_id,
                teachers=dept_teachers
            )
        )

    return schemas.SetupSectionDetail(
        id=setup_section.id,
        section=f"{setup_section.grade}{setup_section.name}",
        courses=course_items
    )
    
    
@router.put("/sections/{section_id}")
def update_section(
    section_id: int,
    payload: schemas.UpdateSectionRequest,
    db: Session = Depends(get_db)
):
    try:
        # 🔵 1. Get section
        setup_section = db.get(SetupSection, section_id)
        if not setup_section:
            raise HTTPException(404, "Setup section not found")

        # 🔵 2. Get all setup courses
        setup_courses = db.exec(
            select(SetupCourseOffering).where(
                SetupCourseOffering.setup_section_id == section_id
            )
        ).all()

        if not setup_courses:
            raise HTTPException(400, "No courses found for this section")

        setup_course_map = {sc.id: sc for sc in setup_courses}

        # 🔵 3. Fetch related courses
        course_ids = [sc.course_id for sc in setup_courses] 
        courses = db.exec(
            select(Course).where(Course.id.in_(course_ids))
        ).all()
        course_map = {c.id: c for c in courses}

        # 🔵 4. Fetch teachers (only non-null ones)
        teacher_ids = [
            c.teacher_id for c in payload.courses if c.teacher_id is not None
        ]

        teachers = db.exec(
            select(Teacher).where(Teacher.id.in_(teacher_ids))
        ).all()
        teacher_map = {t.id: t for t in teachers}

        # 🔵 5. Apply updates
        for item in payload.courses:

            sc = setup_course_map.get(item.setup_course_id)
            if not sc:
                raise HTTPException(
                    400,
                    f"Invalid setup_course_id {item.setup_course_id}"
                )

            # ✅ Unassign case
            if item.teacher_id is None:
                sc.teacher_id = None
                db.add(sc)
                continue

            course = course_map.get(sc.course_id)
            if not course:
                raise HTTPException(
                    500,
                    f"Inconsistent data: course {sc.course_id} not found"
                )

            teacher = teacher_map.get(item.teacher_id)
            if not teacher:
                raise HTTPException(
                    400,
                    f"Teacher {item.teacher_id} not found"
                )

            if teacher.department_id != course.department_id:
                raise HTTPException(
                    400,
                    "Teacher does not belong to course department"
                )

            sc.teacher_id = teacher.id
            db.add(sc)

        # 🔵 6. Recompute is_configured
        all_configured = all(
            sc.teacher_id is not None for sc in setup_courses
        )

        setup_section.is_configured = all_configured
        db.add(setup_section)

        db.commit()

        return {
            "message": "Section updated successfully",
            "is_configured": setup_section.is_configured
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        print(e, "check2")
        db.rollback()
        raise HTTPException(500, "Internal server error")
    
    


@router.post("/commit")
def commit_academic_year(db: Session = Depends(get_db)):
    try:
        setup, setup_sections = validate_commit_preconditions(db)

        semester = create_new_semester(db, setup)

        new_section_map = create_sections(db, setup, setup_sections) 

        promote_students(db, setup, new_section_map) # edit so grade 12 students are not promoted

        create_course_offerings(db, setup, setup_sections, new_section_map, semester)

        setup.status = "completed"
        db.add(setup)

        db.commit()

        return {"message": "Academic year committed successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        print (e, "check 3")
        db.rollback()
        raise HTTPException(500, "Internal server error")
    
    

    
    
@router.post("/enroll-all")
def enroll(db: Session = Depends(get_db)):
    try:
        valid_state, current_semester = check_valid_enrollment_state(db)
        if not valid_state:
            raise HTTPException(400, "Finish migration before enrolling")

        course_offerings = db.exec(
            select(CourseOffering).where(
                CourseOffering.semester_id == current_semester.id
            )
        ).all()
        
        if not course_offerings:
            raise HTTPException(400, "No course offerings found for current semester")
        
        course_offering_ids = {co.id for co in course_offerings}
        existing = db.exec(
            select(Enrollment).where(
                Enrollment.course_offering_id.in_(course_offering_ids)
            )
        ).first()  

        if existing:
            raise HTTPException(400, "Enrollments already exist for this semester, for Bulk Enrollments no enrollments should exist")

        students = db.exec(
            select(Student).where(
                Student.status == StudentStatus.active
            )
        ).all()

        students_by_section = defaultdict(list)
        for student in students:
            students_by_section[student.section_id].append(student)

        for co in course_offerings:
            for student in students_by_section.get(co.section_id, []):

                enrollment = Enrollment(
                    student_id=student.id,
                    course_offering_id=co.id,
                    status="active"
                )
                db.add(enrollment)

        db.commit()

        return {"message": "Enrollments created successfully"}

    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Duplicate enrollments detected")

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        logger.exception("Unexpected error during enroll-all")
        raise HTTPException(500, "Internal server error")