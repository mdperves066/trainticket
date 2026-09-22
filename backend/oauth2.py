import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import database as db
from models import User

load_dotenv()

oauthScheme = OAuth2PasswordBearer(tokenUrl="auth/token")
SECRET_KEY = os.getenv("SECRET_KEY") or "bd_railway_secret_key_super_secure_jwt_token_2026"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def createAccessToken(data: dict):
    toEncode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    toEncode.update({"exp": expire})
    encodedJWT = jwt.encode(toEncode, SECRET_KEY, algorithm=ALGORITHM)
    return encodedJWT


def verifyAccessToken(Token: str, credentialException):
    try:
        # Strip 'Bearer ' prefix if present
        if Token.startswith("Bearer "):
            Token = Token.split(" ")[1]
        payload = jwt.decode(Token, SECRET_KEY, algorithms=[ALGORITHM])
        id: str = payload.get("id")
        if id is None:
            raise credentialException
        return id
    except JWTError:
        raise credentialException


def get_current_user(
    token: str = Depends(oauthScheme), db: Session = Depends(db.get_db)
):
    credentialException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = verifyAccessToken(token, credentialException)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentialException
    return user