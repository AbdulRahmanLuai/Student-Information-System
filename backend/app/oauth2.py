from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from app import database
import jwt
from sqlmodel import select
from app import models, schemas


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
EXPIRATION_TIME = settings.EXPIRATION_TIME


def create_access_token(data: dict):
    
    # data = {"user_id": some_id}
    
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRATION_TIME)
    to_encode.update({"exp": int(expire.timestamp())})
    print(to_encode)

    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY ,algorithm=ALGORITHM)
    return encoded_jwt


from fastapi import HTTPException, status
from jwt import decode, ExpiredSignatureError, InvalidTokenError
from app.config import settings
from app import schemas

def verify_access_token(token: str, credentials_exception) -> schemas.TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        user_id: str = payload.get("user_id")
        user_role: str = payload.get("role")

        if user_id is None or user_role is None:
            raise credentials_exception

    except ExpiredSignatureError:
        raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    return schemas.TokenPayload(id=user_id, role=user_role)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail="invalid credentials",
                                          headers = {"WWW-Authenticate": "Bearer"})
    
    token_data = verify_access_token(token=token, credentials_exception=credentials_exception)
    
    user_query = select(models.User).where(models.User.id == token_data.id)
    user = db.exec(user_query).first()
    
    if not user:
        raise credentials_exception
    
    return user

    
    
    
    
    

    
    


    
    
