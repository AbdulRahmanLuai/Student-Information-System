from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Course, Section, Semester, SemesterStatus, Teacher, CourseOffering, Enrollment
from .dependencies import require_admin

router = APIRouter()

@router.post('/course-offerings', response_model=schemas.CourseOfferingOut, status_code=status.HTTP_201_CREATED)
def create_course_offering(data: schemas.CourseOfferingCreate, db: Session = Depends(get_db),
                           current_user=Depends(require_admin)):

    # validate all foreign keys exist
    course = db.get(Course, data.course_id)
    if not course:
        raise HTTPException(status_code=404, detail=f"course with id {data.course_id} not found")

    section = db.get(Section, data.section_id)
    if not section:
        raise HTTPException(status_code=404, detail=f"section with id {data.section_id} not found")

    semester = db.get(Semester, data.semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail=f"semester with id {data.semester_id} not found")

    teacher = db.get(Teacher, data.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail=f"teacher with id {data.teacher_id} not found")
    
    # check that the semester is not in the past
    current_semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()

    if current_semester:
        is_past = (
            semester.academic_year_start < current_semester.academic_year_start or
            (semester.academic_year_start == current_semester.academic_year_start and
            semester.number < current_semester.number)
        )
        if is_past:
            raise HTTPException(status_code=400, detail="cannot create a course offering for a past semester")

    # check that section belongs to current academic year
    if section.academic_year_start != semester.academic_year_start:
        raise HTTPException(status_code=400, detail=f"section does not belong to the academic year of the selected semester ({semester.academic_year_start})")
    
    if section.grade != course.grade:
        raise HTTPException(status_code=400, detail=f"course is for grade {course.grade} but section is grade {section.grade}")
    
    # check for duplicate course offering
    existing = db.execute(
        select(CourseOffering).where(
            CourseOffering.course_id == data.course_id,
            CourseOffering.section_id == data.section_id,
            CourseOffering.semester_id == data.semester_id
        )
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="a course offering for this course, section, and semester already exists")

    new_offering = CourseOffering(
        course_id=data.course_id,
        section_id=data.section_id,
        semester_id=data.semester_id,
        teacher_id=data.teacher_id
    )
    db.add(new_offering)
    db.commit()

    # re-fetch with all relationships eagerly loaded
    stmt = (
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(CourseOffering.id == new_offering.id)
    )
    new_offering = db.execute(stmt).scalars().first()

    return new_offering


@router.get('/course-offerings', response_model=List[schemas.CourseOfferingOut])
def get_course_offerings(semester_id: Optional[int] = None, teacher_id: Optional[int] = None, section_id: Optional[int] = None, db: Session = Depends(get_db),
                         current_user=Depends(require_admin)):

    # default to current semester if no semester_id provided
    if not semester_id:
        current_semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
        if not current_semester:
            raise HTTPException(status_code=404, detail="no current semester set")
        semester_id = current_semester.id

    stmt = (
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(CourseOffering.semester_id == semester_id)
    )
    if teacher_id:
        teacher = db.execute(select(Teacher).where(Teacher.id == teacher_id))
        if not teacher:
            raise HTTPException(status_code=404, detail=f"teacher with id {teacher_id} not found")
        stmt = stmt.where(CourseOffering.teacher_id == teacher_id)
    if section_id:
        section = db.execute(select(Section).where(Section.id == section_id))
        if not section:
            raise HTTPException(status_code=404, detail=f"section with id {section_id} not found")
        stmt = stmt.where(CourseOffering.section_id == section_id)
    results = db.execute(stmt).scalars().all()

    return results

@router.put('/course-offerings/{course_offering_id}', response_model=schemas.CourseOfferingOut)
def update_course_offering_teacher(
    course_offering_id: int,
    data: schemas.UpdateCourseOfferingTeacher,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # 1. Get the course offering
    course_offering = db.get(CourseOffering, course_offering_id)
    if not course_offering:
        raise HTTPException(status_code=404, detail="Course offering not found")

    # 2. Must belong to the current semester
    current_semester = db.execute(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).scalars().first()
    if not current_semester:
        raise HTTPException(status_code=400, detail="No active semester")
    if course_offering.semester_id != current_semester.id:
        raise HTTPException(status_code=400, detail="Cannot edit a course offering from a past semester")

    # 3. Get the teacher
    teacher = db.get(Teacher, data.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail=f"Teacher with id {data.teacher_id} not found")

    # 4. Get the course to validate department
    course = db.get(Course, course_offering.course_id)
    if not course:
        raise HTTPException(status_code=500, detail="Inconsistent data: course not found")

    # 5. Validate teacher belongs to same department as course
    if teacher.department_id != course.department_id:
        raise HTTPException(
            status_code=400,
            detail="Teacher does not belong to the same department as the course"
        )

    # 6. Apply update
    course_offering.teacher_id = teacher.id
    db.add(course_offering)
    db.commit()

    # 7. Refetch with all relationships
    stmt = (
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(CourseOffering.id == course_offering.id)
    )
    updated = db.execute(stmt).scalars().first()

    return updated

from sqlalchemy.orm import joinedload
from sqlalchemy import select
from fastapi import HTTPException

@router.get("/course-offerings/{course_offering_id}/enrollments", response_model=list[schemas.EnrollmentOut])
def get_course_offering_enrollments(
    course_offering_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # Verify the course offering exists
    course_offering = db.execute(
        select(CourseOffering).where(CourseOffering.id == course_offering_id)
    ).scalars().first()
    if not course_offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    
    # Fetch enrollments with student data
    stmt = (
        select(Enrollment)
        .options(joinedload(Enrollment.student))
        .where(Enrollment.course_offering_id == course_offering_id)
    )
    enrollments = db.execute(stmt).scalars().unique().all()
    
    return enrollments