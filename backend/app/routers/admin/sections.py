from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session, select, func
from sqlalchemy import exists
from typing import List
from ... import schemas
from ...database import get_db
from ...models import Section, Student, CourseOffering, Semester, SemesterStatus, Course, CourseStatus
from .dependencies import require_admin

router = APIRouter()

@router.post("/sections", response_model=schemas.SectionOut)
def create_section(
    section_data: schemas.SectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # 1. Create the section
    new_section = Section(
        grade=section_data.grade,
        name=section_data.name,
        academic_year_start=section_data.academic_year_start
    )
    db.add(new_section)
    db.flush()  # get ID without commit

    # 2. Find current semester
    current_semester = db.execute(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).scalar_one_or_none()

    if current_semester:
        # 3. Find active courses for the same grade
        courses = db.execute(
            select(Course).where(
                Course.grade == section_data.grade,
                Course.status == CourseStatus.active
            )
        ).scalars().all()

        # 4. Create course offerings (teacher = NULL)
        for course in courses:
            offering = CourseOffering(
                course_id=course.id,
                section_id=new_section.id,
                semester_id=current_semester.id,
                teacher_id=None
            )
            db.add(offering)

    db.commit()
    db.refresh(new_section)
    
    return new_section

@router.get('/sections', response_model=List[schemas.SectionOut])
def get_sections(
    academic_year_start: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    # Assume current semester exists (dashboard enforces this)
    current_semester = db.execute(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).scalar_one()
    
    # Subquery: check if any unassigned course offering exists for this section in current semester
    unassigned_exists = exists().where(
        CourseOffering.section_id == Section.id,
        CourseOffering.semester_id == current_semester.id,
        CourseOffering.teacher_id.is_(None)
    ).correlate(Section).label("has_unassigned")
    
    stmt = (
        select(Section, unassigned_exists)
        .where(Section.academic_year_start == academic_year_start)
    )
    
    results = db.execute(stmt).all()
    sections_out = []
    for section, has_unassigned in results:
        sections_out.append(
            schemas.SectionOut(
                id=section.id,
                grade=section.grade,
                name=section.name,
                academic_year_start=section.academic_year_start,
                has_unassigned_course_offerings=has_unassigned
            )
        )
    
    return sections_out

@router.get('/sections/{section_id}', response_model=schemas.SectionOut)
def get_section(section_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@router.delete('/sections/{section_id}', status_code=status.HTTP_200_OK)
def delete_section(section_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    try:
        # 1. Get the section
        section = db.get(Section, section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")

        # 2. Must belong to the current semester's academic year
        current_semester = db.exec(
            select(Semester).where(Semester.status == SemesterStatus.current)
        ).first()
        if not current_semester:
            raise HTTPException(status_code=400, detail="No active semester")
        
        if section.academic_year_start != current_semester.academic_year_start:
            raise HTTPException(status_code=400, detail="Section does not belong to the current academic year")

        # --- NEW CONDITION: Prevent deleting the last section of a grade ---
        total_sections_in_grade = db.exec(
            select(func.count(Section.id)).where(
                Section.grade == section.grade,
                Section.academic_year_start == section.academic_year_start
            )
        ).first()

        if total_sections_in_grade <= 1:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete Grade {section.grade} Section {section.name}. At least one section must remain for this grade."
            )
        # ------------------------------------------------------------------

        # 3. Must have no students
        has_students = db.exec(
            select(Student).where(Student.section_id == section_id)
        ).first()
        if has_students:
            raise HTTPException(status_code=400, detail="Cannot delete a section that has students")

        # 4. Delete course offerings for this section
        course_offerings = db.exec(
            select(CourseOffering).where(CourseOffering.section_id == section_id)
        ).all()
        for co in course_offerings:
            db.delete(co)
        db.flush()

        # 5. Delete the section
        deleted_name = section.name.upper()
        deleted_grade = section.grade
        db.delete(section)
        db.flush()

        # 6. Rename sections that come after the deleted one
        later_sections = db.exec(
            select(Section).where(
                Section.grade == deleted_grade,
                Section.academic_year_start == current_semester.academic_year_start,
                Section.name > deleted_name
            ).order_by(Section.name.asc())
        ).all()

        for s in later_sections:
            current_letter = s.name.upper()
            # Safety check: ensure we are dealing with single-letter names (A, B, C)
            if len(current_letter) == 1 and 'A' < current_letter <= 'Z':
                prev_letter = chr(ord(current_letter) - 1)
                s.name = prev_letter
                db.add(s)

        db.commit()
        return {"message": f"Section deleted and {len(later_sections)} section(s) renamed successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(e, "delete_section error")
        raise HTTPException(status_code=500, detail="Internal server error")