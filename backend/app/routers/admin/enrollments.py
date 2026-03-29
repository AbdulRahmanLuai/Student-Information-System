from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List
from ... import schemas
from ...database import get_db
from ...models import Enrollment, CourseOffering, Course, Teacher
from .dependencies import require_admin

router = APIRouter()



# @router.post('/enrollments/section', response_model=List[schemas.EnrollmentOut], status_code=status.HTTP_201_CREATED)
# def enroll_section(data: schemas.SectionEnrollmentCreate, db: Session = Depends(get_db),
#                    current_user=Depends(require_admin)):

#     # validate section exists
#     section = db.get(Section, data.section_id)
#     if not section:
#         raise HTTPException(status_code=404, detail=f"section with id {data.section_id} not found")

#     # validate semester exists
#     semester = db.get(Semester, data.semester_id)
#     if not semester:
#         raise HTTPException(status_code=404, detail=f"semester with id {data.semester_id} not found")

#     if not semester.is_current:
#         raise HTTPException(status_code=400, detail="enrollments can only be created for the current semester")

#     # get all course offerings for this section in the given semester
#     course_offerings = db.execute(
#         select(CourseOffering).where(
#             CourseOffering.section_id == data.section_id,
#             CourseOffering.semester_id == data.semester_id
#         )
#     ).scalars().all()
#     if not course_offerings:
#         raise HTTPException(status_code=404, detail="no course offerings found for this section in the given semester")

#     # get all students in the section
#     students = db.execute(
#         select(Student).where(Student.section_id == data.section_id)
#     ).scalars().all()
#     if not students:
#         raise HTTPException(status_code=404, detail="no students found in this section")

#     # enroll all students in all course offerings, skip duplicates
#     new_enrollments = []
#     for student in students:
#         for course_offering in course_offerings:
#             existing = db.execute(
#                 select(Enrollment).where(
#                     Enrollment.student_id == student.id,
#                     Enrollment.course_offering_id == course_offering.id
#                 )
#             ).scalars().first()
#             if not existing:
#                 enrollment = Enrollment(
#                     student_id=student.id,
#                     course_offering_id=course_offering.id,
#                     status='active'
#                 )
#                 db.add(enrollment)
#                 new_enrollments.append(enrollment)

#     db.commit()

#     # re-fetch with all relationships eagerly loaded
#     enrollment_ids = [e.id for e in new_enrollments]
#     stmt = (
#         select(Enrollment)
#         .options(
#             joinedload(Enrollment.student),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.course).joinedload(Course.department),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.section),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.semester),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.teacher).joinedload(Teacher.user)
#         )
#         .where(Enrollment.id.in_(enrollment_ids))
#     )
#     new_enrollments = db.execute(stmt).scalars().all()

#     return new_enrollments

# @router.post('/enrollments', response_model=schemas.EnrollmentOut, status_code=status.HTTP_201_CREATED)
# def enroll_student(data: schemas.EnrollmentCreate, db: Session = Depends(get_db),
#                    current_user=Depends(require_admin)):

#     student = db.get(Student, data.student_id)
#     if not student:
#         raise HTTPException(status_code=404, detail=f"student with id {data.student_id} not found")

#     course_offering = db.get(CourseOffering, data.course_offering_id)
#     if not course_offering:
#         raise HTTPException(status_code=404, detail=f"course offering with id {data.course_offering_id} not found")

#     if course_offering.section_id != student.section_id:
#         raise HTTPException(status_code=400, detail="course offering does not belong to the student's section")

#     # check that the course offering belongs to the current semester
#     semester = db.get(Semester, course_offering.semester_id)
#     if not semester.is_current:
#         raise HTTPException(status_code=400, detail="enrollments can only be created for the current semester")

#     existing = db.execute(
#         select(Enrollment).where(
#             Enrollment.student_id == data.student_id,
#             Enrollment.course_offering_id == data.course_offering_id
#         )
#     ).scalars().first()
#     if existing:
#         raise HTTPException(status_code=400, detail="student is already enrolled in this course offering")

#     new_enrollment = Enrollment(
#         student_id=data.student_id,
#         course_offering_id=data.course_offering_id,
#         status='active'
#     )
#     db.add(new_enrollment)
#     db.commit()

#     stmt = (
#         select(Enrollment)
#         .options(
#             joinedload(Enrollment.student),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.course).joinedload(Course.department),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.section),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.semester),
#             joinedload(Enrollment.course_offering).joinedload(CourseOffering.teacher).joinedload(Teacher.user)
#         )
#         .where(Enrollment.id == new_enrollment.id)
#     )
#     new_enrollment = db.execute(stmt).scalars().first()

#     return new_enrollment


# @router.delete('/enrollments/{enrollment_id}', status_code=status.HTTP_204_NO_CONTENT)
# def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db),
#                       current_user=Depends(require_admin)):

#     enrollment = db.get(Enrollment, enrollment_id)
#     if not enrollment:
#         raise HTTPException(status_code=404, detail=f"enrollment with id {enrollment_id} not found")

#     if enrollment.status != 'active':
#         raise HTTPException(status_code=400, detail="only active enrollments can be deleted")

#     # check that the enrollment belongs to the current semester
#     course_offering = db.get(CourseOffering, enrollment.course_offering_id)
#     semester = db.get(Semester, course_offering.semester_id)
#     if not semester.is_current:
#         raise HTTPException(status_code=400, detail="only enrollments from the current semester can be deleted")

#     db.delete(enrollment)
#     db.commit()
    
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
