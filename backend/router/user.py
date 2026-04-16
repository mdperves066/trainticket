from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
import models,schemas,oauth2
import database as db
from fastapi import Depends, HTTPException, APIRouter,status
from sqlalchemy.orm import Session

router = APIRouter(tags=["user"], prefix="/user")


@router.get("/me", response_model=schemas.UserSchema, status_code=status.HTTP_200_OK)
def get_me(user: models.User = Depends(oauth2.get_current_user)):
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@router.put("/me", status_code=status.HTTP_200_OK)
def update_user(userUpdate:schemas.UserSignUp, db:Session = Depends(db.get_db), user: models.User = Depends(oauth2.get_current_user)):
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error"
        )
    
    user.name = userUpdate.name
    user.password = userUpdate.password
    user.email = userUpdate.email
    user.phone = userUpdate.phone
    user.nid = userUpdate.nid
    user.location = userUpdate.location
    user.img_data = userUpdate.img_data
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Updated"
        )

@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_user(db:Session = Depends(db.get_db), user: models.User = Depends(oauth2.get_current_user)):
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error"
        )
    
    db.delete(user)
    db.commit()
    
    raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Deleted"
        )