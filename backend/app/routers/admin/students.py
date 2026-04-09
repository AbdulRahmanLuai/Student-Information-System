from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlmodel import Session, select, String
from sqlalchemy import cast, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Student, Section, Semester, SemesterStatus, StudentStatus
from .dependencies import require_admin

router = APIRouter()


from sqlalchemy import select, or_, cast, String
from sqlalchemy.orm import joinedload, contains_eager

@router.get('/students/search', response_model=List[schemas.StudentOut])
def search(
    db: Session = Depends(get_db), 
    id_prefix: Optional[str] = Query(None), 
    query: Optional[str] = Query(None),
    limit: int = Query(10, le=100)
):
    stmt = select(Student).options(joinedload(Student.section))
    
    if id_prefix:
        stmt = stmt.where(cast(Student.id, String).startswith(id_prefix))
        
    elif query:
        stmt = stmt.where(
            or_(
                Student.first_name.ilike(f"{query}%"),
                Student.last_name.ilike(f"{query}%")
            )
        )
    else:
        raise HTTPException(400, "Provide an id or name")

    stmt = stmt.order_by(Student.id).limit(limit)
    
    results = db.execute(stmt).scalars().all()
    return results

@router.post('/students', response_model=schemas.StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(student_data: schemas.StudentCreate, db: Session = Depends(get_db),
                   current_user=Depends(require_admin)):

    section = db.get(Section, student_data.section_id)
    if not section:
        raise HTTPException(status_code=404, detail=f"section with id {student_data.section_id} not found")

    existing_student = db.execute(select(Student).where(Student.email == student_data.email)).scalars().first()
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
    db.execute(select(Student).options(joinedload(Student.section)).where(Student.id == new_student.id)).scalars().first()

    return new_student


@router.get('/students', response_model=List[schemas.StudentOut])
def get_students(section_id: int, db: Session = Depends(get_db),
                 current_user=Depends(require_admin)):

    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail=f"section with id {section_id} not found")

    stmt = select(Student).options(joinedload(Student.section)).where(
        Student.section_id == section_id,
        Student.status == StudentStatus.active
    )

    return db.execute(stmt).scalars().all()


@router.get('/students/{student_id}', response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):

    student = db.execute(
        select(Student).options(joinedload(Student.section)).where(Student.id == student_id)
    ).scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail=f"student with id {student_id} not found")

    return student


from ...models import Enrollment, CourseOffering

@router.patch('/students/{student_id}/section', response_model=schemas.StudentOut)
def change_student_section(
    student_id: int,
    data: schemas.StudentUpdateSection,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # 1. Get student
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Get current semester
    current_semester = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).first()
    if not current_semester:
        raise HTTPException(status_code=400, detail="No current semester")

    # 3. Get new section
    new_section = db.get(Section, data.section_id)
    if not new_section:
        raise HTTPException(status_code=404, detail="Section not found")
    if new_section.grade != student.section.grade:
        raise HTTPException(status_code=400, detail="Cannot move student to a section of a different grade")

    if new_section.academic_year_start != current_semester.academic_year_start:
        raise HTTPException(status_code=400, detail="Section not in current academic year")

    # 4. Delete current enrollments (ONLY current semester)

    enrollments = db.exec(
        select(Enrollment)
        .options(joinedload(Enrollment.course_offering))
        .where(
            Enrollment.student_id == student_id,
            CourseOffering.semester_id == current_semester.id
        )
    ).all()

    old_course_ids = {e.course_offering.course_id for e in enrollments if e.course_offering}

    for e in enrollments:
        db.delete(e)

    db.flush()

    # 5. Update section
    student.section_id = data.section_id
    db.add(student)
    db.flush()


    # 6. Get new section course offerings (current semester)
    new_offerings = db.exec(
        select(CourseOffering).where(
            CourseOffering.section_id == data.section_id,
            CourseOffering.semester_id == current_semester.id
        )
    ).all()

    # 7. Create new enrollments
    for co in new_offerings:
        if co.course_id not in old_course_ids:
            continue
        
        enrollment = Enrollment(
            student_id=student.id,
            course_offering_id=co.id,
            status="active"
        )
        db.add(enrollment)

    db.commit()

    student = db.execute(
        select(Student).options(joinedload(Student.section)).where(Student.id == student_id)
    ).scalars().first()

    return student