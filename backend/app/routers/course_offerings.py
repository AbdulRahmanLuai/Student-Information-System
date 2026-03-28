from fastapi import APIRouter, Depends, HTTPException, status, Query
from .. import models, schemas
from ..database import get_db
from sqlmodel import Session
from sqlalchemy import select, func, update
from sqlalchemy.orm import joinedload
from ..models import (Section, Semester, Student, Course, CourseOffering, Enrollment, Teacher, User, Role, SemesterStatus)
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
    teacher = db.get(Teacher, teacher_id) 
    
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


router = APIRouter(prefix='/course-offerings', tags=["course-offerings"])



def get_teacher_from_user(user_id: int, db: Session) -> Teacher:
    return db.execute(
        select(Teacher).where(Teacher.user_id == user_id)
    ).scalars().first()


@router.get("", response_model=List[schemas.CourseOfferingOut])
def get_my_course_offerings(
    semester_id: Optional[int] = Query(None),
    current_user=Depends(oauth2.get_current_user),
    db: Session = Depends(get_db)
):
    teacher = get_teacher_from_user(current_user.id, db)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )

    # 🔹 Resolve semester
    if semester_id:
        semester = db.get(Semester, semester_id)
        if not semester:
            raise HTTPException(404, "Semester not found")
    else:
        semester = db.execute(
            select(Semester).where(Semester.status == SemesterStatus.current)
        ).scalars().first()

        if not semester:
            raise HTTPException(400, "No current semester set")

    # 🔹 Query
    stmt = (
        select(CourseOffering)
        .where(
            CourseOffering.teacher_id == teacher.id,
            CourseOffering.semester_id == semester.id
        )
        .options(
            joinedload(CourseOffering.course),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
    )

    return db.execute(stmt).scalars().all()





@router.get("/{course_offering_id}/enrollments", response_model=List[schemas.EnrollmentOut])
def get_course_offering_enrollments(
    course_offering_id: int,
    current_user=Depends(oauth2.get_current_user),
    db: Session = Depends(get_db)
):
    teacher = get_teacher_from_user(current_user.id, db)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )

    stmt = (
        select(Enrollment)
        .join(CourseOffering, Enrollment.course_offering_id == CourseOffering.id)
        .where(
            Enrollment.course_offering_id == course_offering_id,
            CourseOffering.teacher_id == teacher.id
        )
        .options(joinedload(Enrollment.student))
    )

    enrollments = db.execute(stmt).scalars().all()

    if not enrollments:
        # distinguish between "not found" and "no enrollments"
        exists = db.get(CourseOffering, course_offering_id)
        if not exists:
            raise HTTPException(404, "Course offering not found")
        # exists but not owned
        if exists.teacher_id != teacher.id:
            raise HTTPException(403, "Not authorized")

    return enrollments



@router.put("/{enrollment_id}", response_model=schemas.EnrollmentOut)
def enter_mark(
    mark_input: schemas.MarkInput,
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(oauth2.get_current_user)
):
    teacher = get_teacher_from_user(current_user.id, db)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )

    # Atomic update: only active enrollments for the teacher
    stmt = (
        update(Enrollment)
        .where(
            Enrollment.id == enrollment_id,
            Enrollment.status == "active",
            Enrollment.course_offering.has(CourseOffering.teacher_id == teacher.id)
        )
        .values(final_mark=mark_input.mark)
        .returning(Enrollment)
    )

    enrollment = db.execute(stmt).scalars().first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found, not active, or not editable by you"
        )

    db.commit()
    db.refresh(enrollment)
    return enrollment    
    


@router.post("/{course_offering_id}/enrollments/commit", response_model=list[schemas.EnrollmentOut])
def commit_marks(
    course_offering_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(oauth2.get_current_user)
):
    teacher = get_teacher_from_user(current_user.id, db)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )

    # 1️⃣ Validate course offering ownership
    course_offering = db.get(CourseOffering, course_offering_id)
    if not course_offering:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course offering {course_offering_id} does not exist"
        )

    if course_offering.teacher_id != teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to commit marks for this course offering"
        )

    # 2️⃣ Fetch active enrollments
    stmt_active = select(Enrollment).where(
        Enrollment.course_offering_id == course_offering_id,
        Enrollment.status == "active"
    )
    active_enrollments = db.execute(stmt_active).scalars().all()

    if not active_enrollments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No active enrollments for course offering {course_offering_id}"
        )

    # 3️⃣ Ensure all active enrollments have marks
    if any(e.final_mark is None for e in active_enrollments):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All marks must be entered before committing"
        )

    # 4️⃣ Atomic update to completed
    stmt_update = (
        update(Enrollment)
        .where(
            Enrollment.course_offering_id == course_offering_id,
            Enrollment.status == "active"
        )
        .values(status="completed")
    )
    db.execute(stmt_update)
    db.commit()

    # 5️⃣ Refetch ORM objects for response
    updated_enrollments = db.execute(
        select(Enrollment).where(
            Enrollment.course_offering_id == course_offering_id,
            Enrollment.status == "completed"
        )
    ).scalars().all()

    return updated_enrollments


# TODO: Excel in, Excel out
    
    
    
    
    
    
    
    