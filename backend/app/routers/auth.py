from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlmodel import select
from app import database, models, schemas, oauth2
from app.utils.security import verify_password




router = APIRouter(prefix="/auth")




@router.post('/login', response_model=schemas.TokenOut)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    
    
    user_email = form_data.username
    user_password = form_data.password
    
    user_query = select(models.User).where(models.User.email == user_email)
    user = db.exec(user_query).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    

    valid_credentials = verify_password(user_password, user.hashed_password)
    if not valid_credentials:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    
    
    print(user.id, "here")
    # credentials are valid: create access token
    token = oauth2.create_access_token(data = {"user_id": user.id})
    return {"access_token" :token, "token_type": "bearer"}

        
    
    

    
    
    
    
    
    
    