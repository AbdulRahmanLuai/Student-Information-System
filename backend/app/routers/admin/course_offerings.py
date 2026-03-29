from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Course, Section, Semester, SemesterStatus, Teacher, CourseOffering
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
def get_course_offerings(semester_id: Optional[int] = None, teacher_id: Optional[int] = None, db: Session = Depends(get_db),
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
    results = db.execute(stmt).scalars().all()

    return results
