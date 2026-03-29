from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Teacher
from .dependencies import require_admin

router = APIRouter()

@router.get('/teachers', response_model=List[schemas.TeacherOut])
def get_teachers(department_id: Optional[int] = None, db: Session = Depends(get_db), 
                 current_user=Depends(require_admin)):
    
    stmt = select(Teacher).options(joinedload(Teacher.user))
    if department_id:
        stmt = stmt.where(Teacher.department_id == department_id)
    
    results = db.execute(stmt).scalars().all()
    return results
    