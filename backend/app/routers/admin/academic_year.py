from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from sqlalchemy import func
from app import schemas
from app.database import get_db
from app.models import (
    Semester, Section, Student, Course,
    AcademicYearSetup, SetupSection, SetupCourseOffering, SemesterStatus, CourseStatus, StudentStatus
)

router = APIRouter(prefix="/academic-year", tags=["Academic Year"])


MAX_SEMESTERS_PER_YEAR = 3

# --- Helper Functions ---------------------------------------------------------------------------------

def get_last_semester(db: Session) -> Semester:
    semester = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.completed)
        .order_by(Semester.academic_year_start.desc(), Semester.number.desc())
    ).first()

    if not semester:
        raise HTTPException(404, "No semesters found")

    return semester


def ensure_no_active_setup(db: Session):
    existing = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="An academic year setup is already in progress"
        )
        
def create_academic_year_setup(db: Session, new_year: int) -> AcademicYearSetup:
    setup = AcademicYearSetup(
        academic_year_start=new_year,
        status="draft",
        created_at=datetime.utcnow()
    )
    db.add(setup)
    db.flush()
    return setup

def generate_setup_sections(
    db: Session,
    setup: AcademicYearSetup,
    current_year: int
):
    current_sections = db.exec(
        select(Section).where(Section.academic_year_start == current_year)
    ).all()

    if not current_sections:
        raise HTTPException(400, "No sections found for current academic year")
    for section in current_sections:
        
        if section.grade == 12:
            continue
            

        
        student_count = db.exec(
            select(func.count(Student.id)).where(
                Student.section_id == section.id,
                Student.status == StudentStatus.active
            )
        ).one()

    

        setup_section = SetupSection(
            setup_id=setup.id,
            name=section.name,
            grade=section.grade + 1,
            student_count=student_count,
            is_configured=False
        )
        db.add(setup_section)
        db.flush()

        create_section_course_templates(db, setup_section)
        

def create_section_course_templates(
    db: Session,
    setup_section: SetupSection
):
    courses = db.exec(
        select(Course).where(
            Course.grade == setup_section.grade,
            Course.status == CourseStatus.active
        )
    ).all()

    if not courses:
        raise HTTPException(
            status_code=400,
            detail=f"No active courses found for grade {setup_section.grade}"
        )

    for course in courses:
        setup_course = SetupCourseOffering(
            setup_section_id=setup_section.id,
            course_id=course.id,
            teacher_id=None
        )
        db.add(setup_course)
        
def ensure_no_current_semester(db: Session):
    current = db.exec(
        select(Semester).where(Semester.status == SemesterStatus.current)
    ).first()

    if current:
        raise HTTPException(
            status_code=400,
            detail="Cannot start migration while a semester is active"
        )
        
        
def ensure_last_semester_was_final_semester(semester):
    if semester.number != MAX_SEMESTERS_PER_YEAR:
        raise HTTPException(status_code=400, detail="Cannot start migration until the last semester of the academic year is completed")



def get_active_setup(db: Session) -> AcademicYearSetup:
    setup = db.exec(
        select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")
    ).first()

    if not setup:
        raise HTTPException(404, "No active academic year setup found")

    return setup




# --- Endpoints -----------------------------------------------------------------------------------------

@router.post("/start")
def start_academic_year_migration(db: Session = Depends(get_db)):
    
    ensure_no_current_semester(db)
    ensure_no_active_setup(db)
    last_semester = get_last_semester(db)
    ensure_last_semester_was_final_semester(last_semester)
    
    new_year = last_semester.academic_year_start + 1
    

    try:        
        setup = create_academic_year_setup(db, new_year)
        generate_setup_sections(db, setup, last_semester.academic_year_start)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Internal server error")
            
    return {"academicyearsetup_id": setup.id}


@router.delete("/reset")
def reset_academic_year_setup(db: Session = Depends(get_db)):
    drafts = db.exec(select(AcademicYearSetup).where(AcademicYearSetup.status == "draft")).all()
    
    if not drafts:
        raise HTTPException(status_code=404, detail="No draft setup found")
    
    for draft in drafts:
        db.delete(draft)
    
    db.commit()
    return {"message": "Draft setup reset successfully"}


@router.get("/sections", response_model=list[schemas.SetupSectionPreview])
def get_setup_sections(db: Session = Depends(get_db)):

    setup = get_active_setup(db)

    sections = db.exec(
        select(SetupSection).where(SetupSection.setup_id == setup.id)
    ).all()

    result = []

    for s in sections:
        result.append(
            schemas.SetupSectionPreview(
                id=s.id,
                section=f"{s.grade}{s.name}",
                student_count=s.student_count,
                is_configured=s.is_configured
            )
        )

    return result
