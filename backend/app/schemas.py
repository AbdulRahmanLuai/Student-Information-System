from pydantic import BaseModel, Field
from typing import Literal, Optional, Union
from .models import Role
from datetime import date

class CourseOfferingOut(BaseModel):
    section: str
    course_offering_id: int
    course_name: str
    course_code: str
    academic_year_start: int
    academic_year_end: int
    semester_number: Literal[1, 2, 3]
    number_of_students: int
    first_name: str
    last_name: str
    

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class TokenPayload(BaseModel):
    id: int
    

class StudentBasic(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    
    class Config:
        from_attributes = True


class EnrollmentOut(BaseModel):
    student: StudentBasic
    final_mark: Optional[str] = None
    status: str
    id: int
    
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