from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List
from ... import schemas
from ...database import get_db
from ...models import CourseOfferingStatus, Enrollment, CourseOffering, Course, EnrollmentStatus, SemesterStatus, Teacher, Semester
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


@router.delete('/enrollments/{enrollment_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")

    # Only active enrollments can be deleted (completed enrollments are locked)
    if enrollment.status != "active":
        raise HTTPException(400, "Only active enrollments can be deleted")

    course_offering = db.get(CourseOffering, enrollment.course_offering_id)
    if not course_offering or course_offering.status != "active":
        raise HTTPException(400, "Cannot delete enrollment for an inactive course offering")

    semester = db.get(Semester, course_offering.semester_id)
    if not semester or semester.status != SemesterStatus.current:
        raise HTTPException(400, "Can only delete enrollments from the current semester")

    db.delete(enrollment)
    db.commit()
    return