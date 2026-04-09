from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select, String
from sqlalchemy import cast, func, or_
from sqlalchemy.orm import joinedload, contains_eager
from typing import List, Optional
from ... import schemas
from ...database import get_db
from ...models import Teacher, User
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

from sqlalchemy import select, func, cast, String
from sqlalchemy.orm import joinedload

@router.get('/teachers/search', response_model=List[schemas.TeacherOut])
def search(
    db: Session = Depends(get_db), 
    id_prefix: Optional[str] = Query(None), 
    query: Optional[str] = Query(None),
    limit: int = Query(10, le=100) 
):
    stmt = select(Teacher).join(Teacher.user).options(contains_eager(Teacher.user))
    
    if id_prefix:
        stmt = stmt.where(cast(Teacher.id, String).startswith(id_prefix))
        
    elif query:
        stmt = stmt.where(
            or_(
                User.first_name.ilike(f"{query}%"),
                User.last_name.ilike(f"{query}%")
            )
        )
    else:
        raise HTTPException(400, "Provide an id or name")

    stmt = stmt.order_by(Teacher.id).limit(limit)
    
    results = db.execute(stmt).scalars().all()
    return results