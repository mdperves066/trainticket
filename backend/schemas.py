from typing import List
from pydantic import BaseModel
from datetime import date, datetime, time
import base64

class SeatSchemaOut(BaseModel):
    id: int
    type: str
    price: int
    capacity: int

    class Config:
        orm_mode = True


class TrainSchemaOut(BaseModel):
    id: int
    name: str
    seats: List[SeatSchemaOut]

    class Config:
        orm_mode = True



class SeatSchemaIn(BaseModel):
    type: str
    price: int
    capacity: int

    class Config:
        orm_mode = True


class TrainSchemaIn(BaseModel):
    name: str

    class Config:
        orm_mode = True


class PlaceSchemaIn(BaseModel):
    name: str

    class Config:
        orm_mode = True

class PlaceSchemaOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


class RouteSchemaIn(BaseModel):
    source_id: int
    destination_id: int
    distance: int
    leavetime: time
    reachtime: time
    train_id: int


class RouteSchemaOut(BaseModel):
    id: int
    source_name: str
    destination_name: str
    distance: int
    leavetime: time
    reachtime: time
    train_name: str

    class Config:
        orm_mode = True


class PathSh1(BaseModel):
    source_name: str
    destination_name: str
    distance: int
    leavetime: time
    reachtime:time
    duration: int

    class Config:
        orm_mode = True

class PathSh2(BaseModel):
    source_name:str
    destination_name:str
    distance:int

    class Config:
        orm_mode=True

class TrainRouteSchema1(BaseModel):
    train_id: int
    train_name: str
    dflag:int
    path: List[PathSh1]

    class Config:
        orm_mode = True

class TrainRouteSchema2(BaseModel):
    train_id: int
    train_name: str
    path: List[PathSh2]

    class Config:
        orm_mode = True


class AvailSeat(BaseModel):
    id: int
    type: str
    price: int
    available: int

    class Config:
        orm_mode = True


class UserSignUp(BaseModel):
    name: str
    email: str
    role:str
    img_data: bytes
    password: str
    nid:str
    location:str
    phone:str
    
    class Config:
        orm_mode = True

class UserSignIn(BaseModel):
    email: str
    password: str

    class Config:
        orm_mode = True


class UserSchema(BaseModel):
    id: int
    name: str
    password: str
    email: str
    role: str
    nid:str
    location:str 
    phone:str
    img_data: bytes

    class Config:
        orm_mode = True

class PasswordCodeSchema(BaseModel):
    email: str
    code: str

    class Config:
        orm_mode = True
        
class ResetPasswordSchema(BaseModel):
    email: str
    password: str

    class Config:
        orm_mode = True


class TrainPlaceSchemaOut(BaseModel):
    id:int 
    name:str
    incoming_arrival:time
    outgoing_arrival:time
    incoming_departure:time
    outgoing_departure:time

    class Config:
        orm_mode = True