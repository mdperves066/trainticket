from datetime import timedelta
from fastapi import APIRouter
from schemas import SeatSchemaIn,SeatSchemaOut, TrainSchemaIn, TrainSchemaOut, TrainRouteSchema2,PathSh2
from models import Route, Train, Seat
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from database import get_db
from redis_cache import cache 
import json

router = APIRouter(tags=["train"], prefix="/train")

@router.post("/")
def add_train(trainSchema: TrainSchemaIn, db: Session = Depends(get_db)):
    train = Train(name=trainSchema.name)

    db.add(train)
    db.commit()
    db.refresh(train)
    return HTTPException(status_code=200, detail="Train Added Successfully")


@router.get("/all")
def get_all_train(db: Session = Depends(get_db)):
    cached_key = f"train_all"
    cached_train_json = cache.get(cached_key)

    if cached_train_json:
        print("Cache hit")
        cached_train = json.loads(cached_train_json)
        return cached_train
    else:
        print("Cache miss")
        trains = db.query(Train).all()

        if trains:
            trainschema = [
                TrainSchemaOut(
                    id=train.id,
                    name=train.name,
                    seats=[
                        SeatSchemaOut(id=seat.id, type=seat.type, price=seat.price, capacity=seat.capacity)
                        for seat in train.seats
                    ]
                )
                for train in trains
            ]

            trainschema_json = json.dumps([t.model_dump() for t in trainschema])

            cache.set(cached_key, trainschema_json)
            cache.expire(cached_key, timedelta(seconds=60))

            return trainschema

    return trains


@router.get("/{id}")
def get_train(id: int, db: Session = Depends(get_db)):
    cached_key = f"train_{id}"
    cached_train_json = cache.get(cached_key)
    
    if cached_train_json:
        print("Cache hit")
        cached_train = json.loads(cached_train_json)
        return cached_train
    else:
        print("Cache miss")
        train = db.query(Train).filter(Train.id == id).first()
        
        if train:
            seats = [
                SeatSchemaOut(id=seat.id, type=seat.type, price=seat.price, capacity=seat.capacity)
                for seat in train.seats
            ]
            
            trainschema = TrainSchemaOut(id=train.id, name=train.name, seats=seats)
            
            trainschema_json = json.dumps(trainschema)
            
            cache.set(cached_key, trainschema_json)
            cache.expire(cached_key,timedelta(seconds=60))
            
            return trainschema
        else:
            raise HTTPException(status_code=404, detail="Train not found")

@router.delete("/{id}")
def delete_train(id: int, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    routes = db.query(Route).filter(Route.train_id == id).all()
    if train:
        db.delete(train)
        db.delete(routes)
        db.commit()
        return HTTPException(status_code=200, detail="Train Deleted Successfully")
    else:
        return HTTPException(status_code=404, detail="Train Not Found")


@router.post("/seat/{id}")
def add_seat(id: int, seatSchema: SeatSchemaIn, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if train:
        seat = Seat(
            type=seatSchema.type,
            price=seatSchema.price,
            capacity=seatSchema.capacity,
            train_id=train.id,
        )
        train.seats.append(seat)
        db.add(train)
        db.commit()
        db.refresh(seat)
        return HTTPException(status_code=200, detail="Seat Added Successfully")
    else:
        return HTTPException(status_code=404, detail="Train Not Found")


@router.delete("/seat/{id}")
def delete_seat(id: int, db: Session = Depends(get_db)):
    seat = db.query(Seat).filter(Seat.id == id).first()
    if seat:
        db.delete(seat)
        db.commit()
        return HTTPException(status_code=200, detail="Seat Deleted Successfully")
    else:
        return HTTPException(status_code=404, detail="Seat Not Found")

@router.get("/{train_id}/route")
def get_route(train_id:int, dflag:int, db: Session = Depends(get_db)):
    # Create a unique cache key based on the endpoint and parameters
    cached_key = f"route_{train_id}_{dflag}"

    # Try to get the response from the cache
    cached_route_json = cache.get(cached_key)
    
    if cached_route_json:
        print("Cache hit")
        cached_route = json.loads(cached_route_json)
        return cached_route
    else:
        print("Cache miss")
        route = db.query(Route).filter(Route.train_id == train_id,Route.dflag==dflag).first()
        train = db.query(Train).filter(Train.id == train_id).first()
        trainroute = TrainRouteSchema2(train_id=train.id, train_name=train.name, path=[])
        trace_set = set()

        if route:
            trainroute.path.append(PathSh2(source_name=route.source.name, destination_name=route.destination.name, distance=route.distance))
            cur_source = route.destination.id
            trace_set.add(cur_source)
            while True:
                cur_route = db.query(Route).filter(Route.source_id == cur_source, Route.train_id == train_id,Route.dflag==dflag).first()
                if cur_route:
                    trainroute.path.append(PathSh2(source_name=cur_route.source.name, destination_name=cur_route.destination.name, distance=cur_route.distance))
                else:
                    break

                if cur_route.destination.id in trace_set:   
                    break
                
                cur_source = cur_route.destination.id
                trace_set.add(cur_source)

            # Convert trainroute to JSON string for caching
            trainroute_json = json.dumps(trainroute.model_dump())
            
            cache.set(cached_key, trainroute_json)
            cache.expire(cached_key, timedelta(seconds=60))

            return trainroute
        else:
            raise HTTPException(status_code=404, detail="No route available")
    
