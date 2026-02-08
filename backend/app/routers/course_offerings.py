from fastapi import APIRouter, Depends, HTTPException, status
from .. import models, schemas
from ..database import get_db
from sqlmodel import Session
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from ..models import (Section, Semester, Student, Course, CourseOffering, Enrollment, Teacher, User)
from typing import List, Optional
from .. import oauth2


"""
    This route contains all the endpoints that a teacher should have access to:
    
    
    1. get course_offerings
    2. get students enrolled in specific course_offering
    
    
    course_offering: A specific course taught by a teacher to a section in a semester
    
"""

def get_user_from_teacher(teacher_id: int, db: Session) -> Optional[User]:
    """Get the User associated with a Teacher ID."""
    teacher = db.exec(select(Teacher).where(Teacher.id == teacher_id)).first()
    
    if not teacher:
        return None
    
    return teacher.user


def get_teacher_from_user(user_id: int, db: Session) -> Optional[Teacher]:
    return (
        db.exec(
            select(Teacher).where(Teacher.user_id == user_id)
        )
        .scalars()
        .first()
    )


router = APIRouter(prefix='/course-offerings')


@router.get('', response_model=List[schemas.CourseOfferingOut])
def get_course_offerings(
    teacher_id: Optional[int] = None,
    current_user = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns course offerings for the current user.
    Teachers can only view their own courses.
    Admins can supply a teacher_id to view a specific teacher's courses.
    """
    
    # Extract user info
    user_id = current_user.id
    role = current_user.role
    
    # teacher_id passed as parameter: ?teacher_id
    
    # if role = teacher: check that teacher_id is None or equal to teacher.id
    
    if role == "teacher":
        teacher = get_teacher_from_user(user_id, db=db)
        if teacher_id is not None and teacher_id != teacher.id:
            raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, 
            detail=f"you are not authorized to view course offerings of teacher with id: {teacher_id}")
        teacher_id = teacher.id     
    if role=="admin" and teacher_id is not None:
        teacher = db.exec(select(Teacher).where(Teacher.id == teacher_id)).first()
        if not teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"teacher with teacher_id:{teacher_id} does not exist")
    
    
    # Build the query
    query = (
        select(
            Section.name.label("section"),
            Course.name.label("course_name"),
            Course.code.label("course_code"),
            Semester.academic_year_start.label("academic_year_start"),
            Semester.academic_year_end.label("academic_year_end"),
            Semester.number.label("semester_number"),
            User.first_name.label("first_name"),
            User.last_name.label("last_name"),
            CourseOffering.id.label("course_offering_id"),
            func.count(Enrollment.id).label("number_of_students")
        )
        .select_from(CourseOffering)
        .join(Section, CourseOffering.section_id == Section.id)
        .join(Course, CourseOffering.course_id == Course.id)
        .join(Semester, CourseOffering.semester_id == Semester.id)
        .join(Teacher, CourseOffering.teacher_id == Teacher.id)  # Fixed: join on Teacher.id
        .join(User, Teacher.user_id == User.id)  # Fixed: join Teacher to User via user_id
        .outerjoin(Enrollment, CourseOffering.id == Enrollment.course_offering_id)
        .group_by(
            CourseOffering.id,
            Section.name,
            Course.name,
            Course.code,
            Teacher.id,
            User.first_name,
            User.last_name,
            Semester.academic_year_start,
            Semester.academic_year_end,
            Semester.number
        )
    )
    
    if teacher_id:
        query = query.where(Teacher.id == teacher_id)
        

    result = db.exec(query).all()
    return result





@router.get('/{course_offering_id}/enrollments', response_model=List[schemas.EnrollmentOut]) #response model
def get_course_offering_enrollments(course_offering_id: int, current_user=Depends(oauth2.get_current_user), db: Session=Depends(get_db)):
    
    
    course_offering = db.exec(
    select(models.CourseOffering).where(models.CourseOffering.id == course_offering_id)).scalars().first()
    
    if not course_offering:
        raise HTTPException(status_code=404, detail=f"No course offering with id: {course_offering_id} exists")
    
    # check that the teacher owns the course_offering
    if current_user.role == "teacher":
        teacher = get_teacher_from_user(current_user.id, db)
        if course_offering.teacher_id != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view enrollments for this course offering"
            )
    
    enrollments = db.exec(
        select(Enrollment)
        .where(Enrollment.course_offering_id == course_offering_id)
        .options(joinedload(Enrollment.student))
    ).scalars().all() 
    
    return enrollments
    

    
    