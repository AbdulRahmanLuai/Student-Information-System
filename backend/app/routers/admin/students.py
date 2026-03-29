from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Student, Section, Semester, SemesterStatus, StudentStatus
from .dependencies import require_admin

router = APIRouter()

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

# @router.put('/students/{student_id}/section', response_model=schemas.StudentOut)
# def update_student_section(student_id: int, data: schemas.StudentUpdateSection,
#                            db: Session = Depends(get_db), current_user=Depends(require_admin)):

#     # get student
#     student = db.get(Student, student_id)
#     if not student:
#         raise HTTPException(status_code=404, detail=f"student with id {student_id} not found")

#     # get current semester
#     current_semester = db.execute(select(Semester).where(Semester.status == SemesterStatus.current)).scalars().first()
#     if not current_semester:
#         raise HTTPException(status_code=404, detail="no current semester set")

#     # get target section and validate it belongs to current academic year
#     new_section = db.get(Section, data.section_id)
#     if not new_section:
#         raise HTTPException(status_code=404, detail=f"section with id {data.section_id} not found")

#     if new_section.academic_year_start != current_semester.academic_year_start:
#         raise HTTPException(status_code=400, detail=f"section does not belong to the current academic year ({current_semester.academic_year_start})")

#     student.section_id = data.section_id
#     db.commit()
#     db.refresh(student)

#     return student


@router.get('/students', response_model=List[schemas.StudentOut])
def get_students(section_id: int, db: Session = Depends(get_db),
                 current_user=Depends(require_admin)):

    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail=f"section with id {section_id} not found")

    stmt = select(Student).where(
        Student.section_id == section_id,
        Student.status == StudentStatus.active
    )

    return db.execute(stmt).scalars().all()

@router.get('/students/{student_id}', response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"student with id {student_id} not found")

    return student
