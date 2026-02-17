from fastapi import APIRouter, Depends, HTTPException, status
from .. import models, schemas
from ..database import get_db
from sqlmodel import Session
from sqlalchemy import select, func, update
from sqlalchemy.orm import joinedload
from ..models import (Section, Semester, Student, Course, CourseOffering, Enrollment, Teacher, User, Role)
from typing import List, Optional
from .. import oauth2
import secrets
from ..utils.security import pwd_context

def require_admin(current_user = Depends(oauth2.get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="only admins can access this operation")
    return current_user

router = APIRouter(prefix='/admin')

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
    

@router.get('/users')
def get_users():
    # returns a list of all users in the system
    pass

@router.delete('/users/{user_id}')
def delete_user(user_id: int):
    # deletes a user account
    pass


# ── Teachers ─────────────────────────────────────────────────────────────────

@router.post('/teachers')
def create_teacher(user_id: int):
    # creates a teacher profile linked to an existing user
    pass

@router.get('/teachers')
def get_teachers():
    # returns a list of all teachers
    pass


# ── Departments ───────────────────────────────────────────────────────────────

@router.post('/departments')
def create_department():
    # creates a new department
    pass

@router.get('/departments')
def get_departments():
    # returns a list of all departments
    pass


# ── Courses ───────────────────────────────────────────────────────────────────

@router.post('/courses')
def create_course():
    # creates a new course under a department
    pass

@router.get('/courses')
def get_courses():
    # returns a list of all courses
    pass


# ── Sections ──────────────────────────────────────────────────────────────────

@router.post('/sections')
def create_section():
    # creates a new section (e.g. grade/class group)
    pass

@router.get('/sections')
def get_sections():
    # returns a list of all sections
    pass


# ── Semesters ─────────────────────────────────────────────────────────────────

@router.post('/semesters')
def create_semester():
    # creates a new semester
    pass

@router.get('/semesters')
def get_semesters():
    # returns a list of all semesters
    pass

@router.put('/semesters/{semester_id}/set-current')
def set_current_semester(semester_id: int):
    # marks the given semester as the current active semester
    pass


# ── Course Offerings ──────────────────────────────────────────────────────────

@router.post('/course-offerings')
def create_course_offering():
    # creates a course offering by linking a course, section, semester, and teacher
    pass

@router.get('/course-offerings')
def get_course_offerings():
    # returns a list of all course offerings
    pass


# ── Enrollments ───────────────────────────────────────────────────────────────

@router.post('/enrollments')
def create_enrollment():
    # enrolls a student into a course offering
    pass

@router.get('/enrollments')
def get_enrollments():
    # returns a list of all enrollments
    pass

@router.delete('/enrollments/{enrollment_id}')
def delete_enrollment(enrollment_id: int):
    # removes a student enrollment from a course offering
    pass