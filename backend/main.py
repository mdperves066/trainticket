from fastapi import FastAPI,Request,Response
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from router import route,train,path,booking,auth,user,place
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins= ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


models.Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message":"Welcome to Railway Reservation System"}

app.include_router(auth.router)
app.include_router(train.router)
app.include_router(route.router)
app.include_router(path.router)
app.include_router(booking.router)
app.include_router(user.router)
app.include_router(place.router)
