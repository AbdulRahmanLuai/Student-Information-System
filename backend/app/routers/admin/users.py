from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from ... import schemas, oauth2
from ...database import get_db
from ...models import User, Teacher, Role
from ...utils.security import pwd_context
from .dependencies import require_admin
import secrets

router = APIRouter()

@router.post('/users', response_model=schemas.UserCreatedOut)
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db),
                current_user = Depends(require_admin)):
    
    data = user_data.user

    # check that email does not exist
    existing_user = db.exec(select(User).where(User.email == data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"email {data.email} is already registered")
    
    # generate a random password
    plain_password = secrets.token_urlsafe(10)
    hashed_password = pwd_context.hash(plain_password)
    
    # insert the user to the table
    new_user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        hashed_password=hashed_password,
        role=data.role
    )
    db.add(new_user)
    db.flush()  # populates new_user.id without committing yet

    # if role is teacher then a teacher profile should be auto created
    if new_user.role == Role.teacher:
        teacher_profile = Teacher(user_id=new_user.id,
                                  hire_date=data.hire_date,
                                  department_id=data.department_id)
        db.add(teacher_profile)

    db.commit()
    db.refresh(new_user)

    # return user info along with plain text password for admin to hand off
    return schemas.UserCreatedOut(
        id=new_user.id,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        email=new_user.email,
        role=new_user.role,
        plain_password=plain_password
    )
    

@router.get('/users', response_model=List[schemas.UserOut])
def get_users(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    
    stmt = select(User)
    result = db.exec(stmt).scalars().all()
    
    return result

# @router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
# def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    
#     user = db.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail=f"user with id {user_id} not found")
    
#     db.delete(user)
#     db.commit()