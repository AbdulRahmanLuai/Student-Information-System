from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select
from typing import List
from ... import schemas
from ...database import get_db
from ...models import Section
from .dependencies import require_admin

router = APIRouter()

@router.post('/sections', response_model=schemas.SectionOut, status_code=status.HTTP_201_CREATED)
def create_section(section_data: schemas.SectionCreate, db: Session = Depends(get_db),
                   current_user=Depends(require_admin)):

    new_section = Section(grade=section_data.grade, name=section_data.name, academic_year_start=section_data.academic_year_start)
    db.add(new_section)
    db.commit()
    db.refresh(new_section)

    return new_section


@router.get('/sections', response_model=List[schemas.SectionOut])
def get_sections(db: Session = Depends(get_db), current_user=Depends(require_admin)):

    sections = db.exec(select(Section)).scalars().all()

    return sections