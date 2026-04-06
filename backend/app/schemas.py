from pydantic import BaseModel, Field
from typing import Literal, Optional, Union
from .models import Role, SemesterStatus, CourseStatus, StudentStatus
from datetime import date

# class CourseOfferingOut(BaseModel):
#     section: str
#     course_offering_id: int
#     course_name: str
#     course_code: str
#     academic_year_start: int
#     academic_year_end: int
#     semester_number: Literal[1, 2, 3]
#     number_of_students: int
#     first_name: str
#     last_name: str
    

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class TokenPayload(BaseModel):
    id: int
    role: str
    

class StudentBasic(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    
    class Config:
        from_attributes = True



        
        
class MarkInput(BaseModel):
    mark: int = Field(ge=0, le=100) 
    
    
class UserCreateBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    role: Role

class TeacherCreate(UserCreateBase):
    role: Literal[Role.teacher]
    hire_date: Optional[date] = None
    department_id: int

class AdminCreate(UserCreateBase):
    role: Literal[Role.admin]

class UserCreate(BaseModel):
    user: Union[TeacherCreate, AdminCreate] = Field(discriminator='role')
    
class UserCreatedOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: Role
    plain_password: str  # only returned at creation time
    
    
class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True
    
    

class TeacherOut(BaseModel):
    id: int
    hire_date: Optional[date] = None
    department_id: Optional[int] = None
    user: UserOut
    
    class Config:
        from_attributes = True
        
    
class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True
        
class CourseCreate(BaseModel):
    name: str
    code: str
    grade: int
    department_id: int

class CourseOut(BaseModel):
    id: int
    name: str
    code: str
    grade: int
    status: CourseStatus
    department_id: int
    department: DepartmentOut

    class Config:
        from_attributes = True
        

class SectionCreate(BaseModel):
    grade: int
    name: str
    academic_year_start: int

class SectionOut(BaseModel):
    id: int
    grade: int
    name: str
    academic_year_start: int

    class Config:
        from_attributes = True
        
        
class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    enrollment_date: Optional[date] = None
    section_id: int

class StudentOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    enrollment_date: Optional[date] = None
    section_id: int
    status: StudentStatus

    class Config:
        from_attributes = True
        
class StudentUpdateSection(BaseModel):
    section_id: int
    
from pydantic import model_validator

class SemesterCreate(BaseModel):
    academic_year_start: Optional[int] = None
    academic_year_end: Optional[int] = None
    number: Optional[int] = None
    status: SemesterStatus

    @model_validator(mode='after')
    def all_or_nothing(self):
        fields = [self.academic_year_start, self.academic_year_end, self.number]
        if any(f is not None for f in fields) and not all(f is not None for f in fields):
            raise ValueError("either provide all semester fields or none for auto-generation")
        return self
    
class SemesterOut(BaseModel):
    id: int
    academic_year_start: int
    academic_year_end: int
    number: int
    status: SemesterStatus

    class Config:
        from_attributes = True
        
class PendingCourseOfferingOut(BaseModel):
    course_offering_id: int
    course_name: str
    teacher_first_name: str
    teacher_last_name: str
    teacher_email: str
    active_enrollments_count: int

    class Config:
        from_attributes = True
        
class CourseOfferingCreate(BaseModel):
    course_id: int
    section_id: int
    semester_id: int
    teacher_id: int

class CourseOfferingOut(BaseModel):
    id: int
    course: CourseOut
    section: SectionOut
    semester: SemesterOut
    teacher: TeacherOut

    class Config:
        from_attributes = True
        
class SectionEnrollmentCreate(BaseModel):
    section_id: int
    semester_id: int
    
class EnrollmentOut(BaseModel):
    id: int
    final_mark: Optional[str] = None
    status: str
    student: StudentBasic
    course_offering: CourseOfferingOut

    class Config:
        from_attributes = True
        
class EnrollmentCreate(BaseModel):
    student_id: int
    course_offering_id: int
    
    
class SetupSectionPreview(BaseModel):
    id: int
    section: str
    student_count: int
    is_configured: bool
    
    
from pydantic import BaseModel

class TeacherOption(BaseModel):
    id: int
    name: str


class SetupCourseItem(BaseModel):
    setup_course_id: int
    course_id: int
    course_name: str
    teacher_id: int | None
    teachers: list[TeacherOption]


class SetupSectionDetail(BaseModel):
    id: int
    section: str
    courses: list[SetupCourseItem]
    
from pydantic import BaseModel

class CourseAssignment(BaseModel):
    setup_course_id: int
    teacher_id: int | None


class UpdateSectionRequest(BaseModel):
    courses: list[CourseAssignment]
    
class EnrollmentStatusOut(BaseModel):
    should_enroll: bool
    
class UpdateCourseOfferingTeacher(BaseModel):
    teacher_id: int