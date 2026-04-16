from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
import models,schemas,oauth2,utils
import database as db
from fastapi import Depends, HTTPException, APIRouter,status
from sqlalchemy.orm import Session

router = APIRouter(tags=["auth"], prefix="/auth")



@router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],db:Session = Depends(db.get_db)
):
    
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not utils.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    accessToken = oauth2.createAccessToken(data = {"id":user.id, 
                                                    "email":user.email,
                                                    "role":user.role,
                                                    "name":user.name,
                                                    "phone":user.phone})
    
    jwt_token = {
        "access_token": accessToken,
        "token_type": "bearer"
    }

    return jwt_token

@router.post("/signup")
def signup(userSignUp:schemas.UserSignUp, db:Session = Depends(db.get_db)):
    if db.query(models.User).filter(models.User.email == userSignUp.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with Same Email already exists"
        )
    
    if(userSignUp.name == "" or userSignUp.email == "" or userSignUp.password == "" or userSignUp.role == "" or userSignUp.nid == "" or userSignUp.location == "" or userSignUp.phone == ""):  
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide Necessary Details")
    
    user = models.User(**userSignUp.model_dump())
    
    db.add(user)
    db.commit()
    db.refresh(user)

    raise HTTPException(
        status_code=status.HTTP_201_CREATED,
        detail="Success"
    )

@router.post("/signin")
def signin(userSignIn:schemas.UserSignIn, db:Session = Depends(db.get_db)):
    if userSignIn.email == "" or userSignIn.password == "":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide Necessary Details")
    

    user = db.query(models.User).filter(models.User.email == userSignIn.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not utils.verify(userSignIn.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    access_token = oauth2.createAccessToken(data = {"id":user.id,
                                                    "email":user.email,
                                                    "role":user.role,
                                                    "name":user.name})
    
    return {"id":user.id,"access_token":access_token, "token_type":"bearer", "email":user.email, "role":user.role, "name":user.name}


@router.post("/forget_password", status_code=status.HTTP_200_OK)
def forgetpassword(codeSchema:schemas.PasswordCodeSchema, db:Session = Depends(db.get_db)):
    code = db.query(models.PasswordCode).filter(models.PasswordCode.email == codeSchema.email).first()
    
    if code:
        db.delete(code)
        db.commit()
    
    db.add(models.PasswordCode(**codeSchema.model_dump()))
    db.commit()

    raise HTTPException(status_code=status.HTTP_202_ACCEPTED,detail="Success")

@router.post("/confirm_code")
def confirmPassword(codeSchema:schemas.PasswordCodeSchema,db:Session= Depends(db.get_db)):
    code = db.query(models.PasswordCode).filter(models.PasswordCode.email == codeSchema.email).first()

    if codeSchema.code == code.code:
        db.delete(code)
        db.commit()
        raise HTTPException(status_code=status.HTTP_202_ACCEPTED,detail="Success")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail = "Error")
    

@router.post("/reset_password")
def reset_password(resetPassword:schemas.ResetPasswordSchema, db:Session = Depends(db.get_db)):
    user = db.query(models.User).filter(models.User.email == resetPassword.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password = resetPassword.password
    db.add(user)
    db.commit()
    
    raise HTTPException(
        status_code=status.HTTP_200_OK,
        detail="Success"
    )


