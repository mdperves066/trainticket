from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import  timedelta
from models import Place,Route, Train
from schemas import PlaceSchemaIn, TrainPlaceSchemaOut, PlaceSchemaOut
import json
from redis_cache import cache


router = APIRouter(
    tags=["place"],
    prefix="/place"
)




@router.post("/")
def add_place(placeSchema: PlaceSchemaIn, db: Session = Depends(get_db)):
    place = Place(name = placeSchema.name)
    db.add(place)
    db.commit()
    db.refresh(place)
    return HTTPException(status_code=200, detail="Place Added Successfully")

@router.get("/all")
def get_all_place(db: Session = Depends(get_db)):
    cached_key = f"place_all"
    cached_place_json = cache.get(cached_key)

    if cached_place_json:
        print("Cache hit")
        cached_place = json.loads(cached_place_json)
        return cached_place
    else:
        print("Cache miss")
        places = db.query(Place).all()

        if places:
            placeschema = [
                PlaceSchemaOut(
                    id=place.id,
                    name=place.name
                )
                for place in places
            ]

            placeschema_json = json.dumps([p.model_dump() for p in placeschema])

            cache.set(cached_key, placeschema_json)
            cache.expire(cached_key, timedelta(seconds=60))

            return placeschema

@router.delete("/{id}")
def delete_place(id:int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == id).first()
    routes = db.query(Route).filter(Route.source_id == id | Route.destination_id==id).all()
    if place:
        db.delete(place)
        db.commit()
        return HTTPException(status_code=200, detail="Place Deleted Successfully")
    else:
        return HTTPException(status_code=404, detail="Place Not Found")
    

@router.get("/{id}/trains")
def get_trains(id:int,db:Session=Depends(get_db)):
    
    trains = db.query(Train).join(Route,Route.train_id==Train.id).filter(Route.source_id==id).all()

    trainsSchema = []

    for train in trains:
        route1 = db.query(Route).filter(Route.train_id==train.id,Route.source_id==id,Route.dflag==0).first()
        route2 = db.query(Route).filter(Route.train_id==train.id,Route.source_id==id,Route.dflag==1).first()

        outgoing_departure = route1.leavetime if route1 else "00:00"
        incoming_departure = route2.leavetime if route2 else "00:00"

        route3 = db.query(Route).filter(Route.train_id==train.id,Route.destination_id==id,Route.dflag==0).first()
        route4 = db.query(Route).filter(Route.train_id==train.id,Route.destination_id==id,Route.dflag==1).first()

        outgoing_arrival = route3.reachtime if route3 else "00:00"
        incoming_arrival = route4.reachtime if route4 else "00:00"

        trainsSchema.append(TrainPlaceSchemaOut(
            id=train.id,
            name=train.name,
            outgoing_departure=outgoing_departure,
            incoming_departure=incoming_departure,
            outgoing_arrival=outgoing_arrival,
            incoming_arrival=incoming_arrival
        ))

    return trainsSchema
    