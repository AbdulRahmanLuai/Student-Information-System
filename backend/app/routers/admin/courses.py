from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Course, Department
from .dependencies import require_admin

router = APIRouter()


@router.post('/courses', response_model=schemas.CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(course_data: schemas.CourseCreate, db: Session = Depends(get_db),
                  current_user=Depends(require_admin)):

    department = db.get(Department, course_data.department_id)
    if not department:
        raise HTTPException(status_code=404, detail=f"department with id {course_data.department_id} not found")

    new_course = Course(name=course_data.name, code=course_data.code, grade=course_data.grade, department_id=course_data.department_id)
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
