"""
TODO: Handle graduating/leaving students
[future change]: add status column for students (active, inactive, etc)

"""


from fastapi import APIRouter, Depends, HTTPException, status
from .. import models, schemas
from ..database import get_db
from sqlmodel import Session
from sqlalchemy import select, func, update, or_, and_
from sqlalchemy.orm import joinedload
from ..models import (Section, Semester, Student, Course, CourseOffering, Enrollment, Teacher, User, Role, Department, SemesterStatus)
from typing import List, Optional
from .. import oauth2
import secrets
from ..utils.security import pwd_context
from datetime import date

def require_admin(current_user = Depends(oauth2.get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="only admins can access this operation")
    return current_user

router = APIRouter(prefix='/admin', tags=["admin"])

# ── Users ────────────────────────────────────────────────────────────────────

@router.post('/users', response_model=schemas.UserCreatedOut)
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db),
                current_user = Depends(require_admin)):
    
    data = user_data.user

    # check that email does not exist
    existing_user = db.exec(select(User).where(User.email == data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"email {data.email} is already registered")
    
    # generate a random password
    plain_password = secrets.token_urlsafe(10)
    hashed_password = pwd_context.hash(plain_password)
    
    # insert the user to the table
    new_user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        hashed_password=hashed_password,
        role=data.role
    )
    db.add(new_user)
    db.flush()  # populates new_user.id without committing yet

    # if role is teacher then a teacher profile should be auto created
    if new_user.role == Role.teacher:
        teacher_profile = Teacher(user_id=new_user.id,
                                  hire_date=data.hire_date,
                                  department_id=data.department_id)
        db.add(teacher_profile)

    db.commit()
    db.refresh(new_user)

    # return user info along with plain text password for admin to hand off
    return schemas.UserCreatedOut(
        id=new_user.id,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        email=new_user.email,
        role=new_user.role,
        plain_password=plain_password
    )
    

@router.get('/users', response_model=List[schemas.UserOut])
def get_users(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    
    stmt = select(User)
    result = db.exec(stmt).scalars().all()
    
    return result

    

# @router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
# def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    
#     user = db.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail=f"user with id {user_id} not found")
    
#     db.delete(user)
#     db.commit()

# ── Teachers ─────────────────────────────────────────────────────────────────


@router.get('/teachers', response_model=List[schemas.TeacherOut])
def get_teachers(department_id: Optional[int] = None, db: Session = Depends(get_db), 
                 current_user=Depends(require_admin)):
    
    stmt = select(Teacher).options(joinedload(Teacher.user))
    if department_id:
        stmt = stmt.where(Teacher.department_id == department_id)
    
    results = db.execute(stmt).scalars().all()
    return results
    


# ── Departments ───────────────────────────────────────────────────────────────

@router.post('/departments', response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(department_data: schemas.DepartmentCreate, db: Session = Depends(get_db),
                      current_user=Depends(require_admin)):
    
    new_department = Department(name=department_data.name, code=department_data.code)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return new_department


@router.get('/departments', response_model=List[schemas.DepartmentOut])
def get_departments(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    
    departments = db.exec(select(Department)).scalars().all()
    
    return departments


# ── Courses ───────────────────────────────────────────────────────────────────

@router.post('/courses', response_model=schemas.CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(course_data: schemas.CourseCreate, db: Session = Depends(get_db),
                  current_user=Depends(require_admin)):

    department = db.get(Department, course_data.department_id)
    if not department:
        raise HTTPException(status_code=404, detail=f"department with id {course_data.department_id} not found")

    new_course = Course(name=course_data.name, code=course_data.code, department_id=course_data.department_id)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course


@router.get('/courses', response_model=List[schemas.CourseOut])
def get_courses(department_id: Optional[int] = None, db: Session = Depends(get_db), 
                current_user=Depends(require_admin)):
    
    stmt = select(Course).options(joinedload(Course.department))
    if department_id:
        stmt = stmt.where(Course.department_id == department_id)
    
    courses = db.execute(stmt).scalars().all()
    return courses

# ── Sections ──────────────────────────────────────────────────────────────────

@router.post('/sections', response_model=schemas.SectionOut, status_code=status.HTTP_201_CREATED)
def create_section(section_data: schemas.SectionCreate, db: Session = Depends(get_db),
                   current_user=Depends(require_admin)):

    new_section = Section(grade=section_data.grade, name=section_data.name, academic_year_start=section_data.academic_year_start)
    db.add(new_section)
    db.commit()
    db.refresh(new_section)

    return new_section


@router.get('/sections', response_model=List[schemas.SectionOut])
def get_sections(db: Session = Depends(get_db), current_user=Depends(require_admin)):

    sections = db.exec(select(Section)).scalars().all()

    return sections

# -- Student --------------------------------------------------------------
@router.post('/students', response_model=schemas.StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(student_data: schemas.StudentCreate, db: Session = Depends(get_db),
                   current_user=Depends(require_admin)):

    section = db.get(Section, student_data.section_id)
    if not section:
        raise HTTPException(status_code=404, detail=f"section with id {student_data.section_id} not found")

    existing_student = db.exec(select(Student).where(Student.email == student_data.email)).scalars().first()
    if existing_student:
        raise HTTPException(status_code=400, detail=f"email {student_data.email} is already registered")
    
    current_semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
    if not current_semester:
        raise HTTPException(status_code=400, detail="no current semester set")

    if section.academic_year_start != current_semester.academic_year_start:
        raise HTTPException(status_code=400, detail=f"section does not belong to the current academic year ({current_semester.academic_year_start})")

    new_student = Student(
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        email=student_data.email,
        enrollment_date=student_data.enrollment_date,
        section_id=student_data.section_id
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student

@router.put('/students/{student_id}/section', response_model=schemas.StudentOut)
def update_student_section(student_id: int, data: schemas.StudentUpdateSection,
                           db: Session = Depends(get_db), current_user=Depends(require_admin)):

    # get student
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"student with id {student_id} not found")

    # get current semester
    current_semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
    if not current_semester:
        raise HTTPException(status_code=404, detail="no current semester set")

    # get target section and validate it belongs to current academic year
    new_section = db.get(Section, data.section_id)
    if not new_section:
        raise HTTPException(status_code=404, detail=f"section with id {data.section_id} not found")

    if new_section.academic_year_start != current_semester.academic_year_start:
        raise HTTPException(status_code=400, detail=f"section does not belong to the current academic year ({current_semester.academic_year_start})")

    student.section_id = data.section_id
    db.commit()
    db.refresh(student)

    return student


@router.get('/students', response_model=List[schemas.StudentOut])
def get_students(section_id: Optional[int] = None, db: Session = Depends(get_db),
                 current_user=Depends(require_admin)):

    stmt = select(Student)
    print(section_id)
    if section_id:
        stmt = stmt.where(Student.section_id == section_id)

    students = db.execute(stmt).scalars().all()
    return students

@router.get('/students/{student_id}', response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"student with id {student_id} not found")

    return student

# ── Semesters ─────────────────────────────────────────────────────────────────


@router.post("/semesters/end", response_model=schemas.SemesterOut)
def end_semester(db: Session = Depends(get_db)):
    semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
    if not semester:
        raise HTTPException(status_code=404, detail="No active semester found")

    active_enrollment = db.execute(
        select(Enrollment)
        .join(CourseOffering, Enrollment.course_offering_id == CourseOffering.id)
        .where(
            CourseOffering.semester_id == semester.id,
            Enrollment.status == "active"
        )
    ).scalars().first()

    if active_enrollment:
        raise HTTPException(status_code=400, detail="Cannot end semester with active enrollments")

    semester.status = SemesterStatus.completed
    db.commit()
    db.refresh(semester)

    return semester



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
            select(Student).where(Student.section_id == section_id)
        ).scalars().all() # [future change]: filter active students only

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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        

    return new_semester


@router.get('/semesters', response_model=List[schemas.SemesterOut])
def get_semesters(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    semesters = db.execute(select(Semester)).scalars().all()
    return semesters


# ── Course Offerings ──────────────────────────────────────────────────────────

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

# ── Enrollments ───────────────────────────────────────────────────────────────

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
