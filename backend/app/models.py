from typing import Optional
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from sqlalchemy import Column, Integer, ForeignKey
from enum import Enum
from typing import Optional, List
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    teacher = "teacher"

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: Role

    teacher_profile: Optional["Teacher"] = Relationship(back_populates="user")


class Department(SQLModel, table=True):
    __tablename__ = "departments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str
    
    # Relationships
    teachers: list["Teacher"] = Relationship(back_populates="department")
    courses: list["Course"] = Relationship(back_populates="department")


class Teacher(SQLModel, table=True):
    __tablename__ = "teachers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    hire_date: Optional[date] = None
    department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
    user: User = Relationship(back_populates="teacher_profile")

    # Relationships
    department: Optional[Department] = Relationship(back_populates="teachers")
    course_offerings: list["CourseOffering"] = Relationship(back_populates="teacher")


from enum import Enum

class CourseStatus(str, Enum):
    active = "active"
    inactive = "inactive"

class Course(SQLModel, table=True):
    __tablename__ = "courses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str
    grade: int
    department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
    status: CourseStatus = Field(default=CourseStatus.active)
    
    # Relationships
    department: Optional[Department] = Relationship(back_populates="courses")
    course_offerings: list["CourseOffering"] = Relationship(back_populates="course")


class Section(SQLModel, table=True):
    __tablename__ = "sections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    grade: int
    name: str
    academic_year_start: int
    
    # Relationships
    students: list["Student"] = Relationship(back_populates="section")
    course_offerings: list["CourseOffering"] = Relationship(back_populates="section")

class SemesterStatus(str, Enum):
    upcoming = "upcoming"
    current = "current"
    completed = "completed"

class Semester(SQLModel, table=True):
    __tablename__ = "semesters"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    academic_year_start: int
    academic_year_end: int
    number: int
    status: SemesterStatus

    course_offerings: list["CourseOffering"] = Relationship(back_populates="semester")

class StudentStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    graduated = "graduated"

class Student(SQLModel, table=True):
    __tablename__ = "students"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    email: str
    enrollment_date: Optional[date] = None
    section_id: Optional[int] = Field(default=None, foreign_key="sections.id")
    status: StudentStatus = Field(default=StudentStatus.active)
    
    # Relationships
    section: Optional[Section] = Relationship(back_populates="students")
    enrollments: list["Enrollment"] = Relationship(back_populates="student")

class CourseOfferingStatus(str, Enum):
    active = "active"
    completed = "completed"
    
class CourseOffering(SQLModel, table=True):
    __tablename__ = "course_offerings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: Optional[int] = Field(default=None, foreign_key="courses.id")
    section_id: Optional[int] = Field(default=None, foreign_key="sections.id")
    semester_id: Optional[int] = Field(default=None, foreign_key="semesters.id")
    teacher_id: Optional[int] = Field(default=None, foreign_key="teachers.id")
    status: str = Field(default=CourseOfferingStatus.active)    
    
    # Relationships
    course: Optional[Course] = Relationship(back_populates="course_offerings")
    section: Optional[Section] = Relationship(back_populates="course_offerings")
    semester: Optional[Semester] = Relationship(back_populates="course_offerings")
    teacher: Optional[Teacher] = Relationship(back_populates="course_offerings")
    enrollments: list["Enrollment"] = Relationship(back_populates="course_offering")

class EnrollmentStatus(str, Enum):
    active = "active"
    completed = "completed"
    
class Enrollment(SQLModel, table=True):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "course_offering_id", name="uq_student_course"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: Optional[int] = Field(default=None, foreign_key="students.id")
    course_offering_id: Optional[int] = Field(default=None, foreign_key="course_offerings.id")
    final_mark: Optional[str] = None
    status: EnrollmentStatus = Field(default=EnrollmentStatus.active)
    
    # Relationships
    student: Optional[Student] = Relationship(back_populates="enrollments")
    course_offering: Optional[CourseOffering] = Relationship(back_populates="enrollments")
    
    

# --- Draft Tables ---------------------------------------------------------------------------------------
class AcademicYearSetup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    academic_year_start: int  # e.g. 2026
    status: str = "draft"  # draft | completed
    
    created_at: datetime
    
class SetupSection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    setup_id: int = Field(sa_column=Column(Integer, ForeignKey("academicyearsetup.id", ondelete="CASCADE")))

    name: str        # "A", "B"
    grade: int       # promoted grade
    
    student_count: int
    is_configured: bool = False
    
    
class SetupCourseOffering(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    setup_section_id: int = Field(sa_column=Column(Integer, ForeignKey("setupsection.id", ondelete="CASCADE")))

    
    course_id: int
    teacher_id: Optional[int] = None
    
    