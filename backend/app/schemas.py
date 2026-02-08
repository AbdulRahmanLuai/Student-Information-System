from pydantic import BaseModel
from typing import Literal

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
    
    
from pydantic import BaseModel
from typing import Optional

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
    
    class Config:
        from_attributes = True