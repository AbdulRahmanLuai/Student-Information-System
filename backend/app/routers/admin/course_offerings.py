from urllib import response
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Course, CourseOfferingStatus, EnrollmentStatus, Section, Semester, SemesterStatus, Student, StudentStatus, Teacher, CourseOffering, Enrollment, Department
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
def get_course_offerings(
    semester_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    section_id: Optional[int] = None,
    department_id: Optional[int] = None,
    academic_year_start: Optional[int] = None,
    semester_number: Optional[int] = None,   # new
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    stmt = (
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
    )

    # Semester filtering: prioritize semester_number+year over semester_id
    if academic_year_start is not None and semester_number is not None:
        semester = db.execute(
            select(Semester).where(
                Semester.academic_year_start == academic_year_start,
                Semester.number == semester_number
            )
        ).scalar_one_or_none()
        if not semester:
            raise HTTPException(400, f"Semester {semester_number} does not exist for year {academic_year_start}")
        stmt = stmt.where(CourseOffering.semester_id == semester.id)
    elif academic_year_start is not None:
        stmt = stmt.join(CourseOffering.semester).where(Semester.academic_year_start == academic_year_start)
    elif semester_id is not None:
        stmt = stmt.where(CourseOffering.semester_id == semester_id)

    # Apply other filters
    if teacher_id is not None:
        stmt = stmt.where(CourseOffering.teacher_id == teacher_id)
    if section_id is not None:
        stmt = stmt.where(CourseOffering.section_id == section_id)
    if department_id is not None:
        stmt = stmt.join(CourseOffering.course).where(Course.department_id == department_id)
    if course_id is not None:
        stmt = stmt.where(CourseOffering.course_id == course_id)

    results = db.execute(stmt).scalars().unique().all()
    return results

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

@router.get('/course-offerings/{course_offering_id}/available-students', response_model=List[schemas.StudentOut])
def get_available_students_for_course_offering(
    course_offering_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    course_offering = db.get(CourseOffering, course_offering_id)
    if not course_offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    
    # Get all active students in the same section who are not already enrolled in this course offering
    stmt = (
        select(Student)
        .where(
            Student.section_id == course_offering.section_id,
            Student.status == StudentStatus.active,  
            ~Student.enrollments.any(Enrollment.course_offering_id == course_offering_id)
        )
    )
    students = db.execute(stmt).scalars().all()
    print(students)
    return students

@router.get('/course-offerings/{course_offering_id}', response_model=schemas.CourseOfferingOut)
def get_course_offering(course_offering_id: int, db: Session = Depends(get_db)):
    course_offering = db.execute(
        select(CourseOffering)
        .options(
            joinedload(CourseOffering.course).joinedload(Course.department),
            joinedload(CourseOffering.section),
            joinedload(CourseOffering.semester),
            joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(CourseOffering.id == course_offering_id)
    ).scalars().first()

    if not course_offering:
        raise HTTPException(status_code=404, detail=f"course offering with id {course_offering_id} not found")
    
    return course_offering

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


@router.post('/course-offerings/{course_offering_id}/enrollments', response_model=schemas.EnrollmentOut, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    course_offering_id: int,
    data: schemas.EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # 1. Verify course offering exists and status is active
    course_offering = db.execute(
        select(CourseOffering).where(CourseOffering.id == course_offering_id)
    ).scalar_one_or_none()
    if not course_offering:
        raise HTTPException(404, "Course offering not found")
    if course_offering.status != CourseOfferingStatus.active:
        raise HTTPException(400, "Cannot enroll in an inactive course offering")
    
    # 2. Verify semester is current
    semester = db.get(Semester, course_offering.semester_id)
    if not semester or semester.status != SemesterStatus.current:
        raise HTTPException(400, "Enrollment only allowed for current semester")
    
    # 3. Verify student exists and is active
    student = db.execute(
        select(Student).where(Student.id == data.student_id, Student.status == StudentStatus.active)
    ).scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Student not found or not active")
    
    # 4. Verify student section matches course offering section
    if student.section_id is None:
        raise HTTPException(400, "Student has no assigned section")
    if student.section_id != course_offering.section_id:
        raise HTTPException(400, "Student is not in the same section as the course offering")
    
    # 5. Check for existing enrollment
    existing = db.execute(
        select(Enrollment).where(
            Enrollment.student_id == data.student_id,
            Enrollment.course_offering_id == course_offering_id
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Student is already enrolled in this course offering")
    
    # 6. Create enrollment
    enrollment = Enrollment(
        student_id=data.student_id,
        course_offering_id=course_offering_id,
        status="active"
    )
    db.add(enrollment)
    db.commit()
    
    # 7. Reload with all relationships expected by EnrollmentOut
    stmt = (
        select(Enrollment)
        .options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course_offering)
                .joinedload(CourseOffering.course)
                .joinedload(Course.department),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.section),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.semester),
            joinedload(Enrollment.course_offering).joinedload(CourseOffering.teacher).joinedload(Teacher.user)
        )
        .where(Enrollment.id == enrollment.id)
    )
    created = db.execute(stmt).scalars().first()
    return created