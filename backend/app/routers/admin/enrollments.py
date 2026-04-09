from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List
from ... import schemas
from ...database import get_db
from ...models import Enrollment, CourseOffering, Course, Teacher
from .dependencies import require_admin

router = APIRouter()




    
@router.get('/enrollments', response_model=List[schemas.EnrollmentOut])
def get_enrollments(course_offering_id: int, db: Session = Depends(get_db),
                    current_user=Depends(require_admin)):

    course_offering = db.get(CourseOffering, course_offering_id)
    if not course_offering:
        raise HTTPException(status_code=404, detail=f"course offering with id {course_offering_id} not found")

    stmt = (
        select(Enrollment)
        .options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.section),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.semester),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(Enrollment.course_offering_id == course_offering_id)
    )

    enrollments = db.execute(stmt).scalars().all()
    return enrollments
