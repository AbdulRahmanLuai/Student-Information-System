from fastapi import APIRouter, Depends
from fastapi import status
from sqlmodel import Session, select
from typing import List
from ... import schemas
from ...database import get_db
from ...models import Department
from .dependencies import require_admin

router = APIRouter()

@router.post('/departments', response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(department_data: schemas.DepartmentCreate, db: Session = Depends(get_db),
                      current_user=Depends(require_admin)):
    
    new_department = Department(name=department_data.name, code=department_data.code)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return new_department


@router.get('/departments', response_model=List[schemas.DepartmentOut])
def get_departments(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    
    departments = db.exec(select(Department)).scalars().all()
    
    return departments