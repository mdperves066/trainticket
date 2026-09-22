from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from schemas import (
    SeatSchemaIn,
    SeatSchemaOut,
    TrainSchemaIn,
    TrainSchemaOut,
    TrainRouteSchema2,
    PathSh2,
)
from models import Route, Train, Seat
from sqlalchemy.orm import Session
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
    cache.delete("train_all")
    return {"detail": "Train Added Successfully", "id": train.id, "name": train.name}


@router.get("/all")
def get_all_train(db: Session = Depends(get_db)):
    cached_key = "train_all"
    cached_train_json = cache.get(cached_key)

    if cached_train_json:
        return json.loads(cached_train_json)

    trains = db.query(Train).all()
    trainschema = [
        TrainSchemaOut(
            id=train.id,
            name=train.name,
            seats=[
                SeatSchemaOut(
                    id=seat.id,
                    type=seat.type,
                    price=seat.price,
                    capacity=seat.capacity,
                )
                for seat in train.seats
            ],
        )
        for train in trains
    ]

    trainschema_json = json.dumps([t.model_dump() for t in trainschema])
    cache.set(cached_key, trainschema_json)
    cache.expire(cached_key, timedelta(seconds=60))

    return trainschema


@router.get("/{id}")
def get_train(id: int, db: Session = Depends(get_db)):
    cached_key = f"train_{id}"
    cached_train_json = cache.get(cached_key)

    if cached_train_json:
        return json.loads(cached_train_json)

    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    trainschema = {
        "id": train.id,
        "name": train.name,
        "seats": [
            {
                "id": seat.id,
                "type": seat.type,
                "price": seat.price,
                "capacity": seat.capacity,
            }
            for seat in train.seats
        ],
    }

    trainschema_json = json.dumps(trainschema)
    cache.set(cached_key, trainschema_json)
    cache.expire(cached_key, timedelta(seconds=60))

    return trainschema


@router.delete("/{id}")
def delete_train(id: int, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train Not Found")

    routes = db.query(Route).filter(Route.train_id == id).all()
    for route in routes:
        db.delete(route)

    db.delete(train)
    db.commit()
    cache.delete("train_all")
    cache.delete(f"train_{id}")
    return {"detail": "Train Deleted Successfully"}


@router.post("/{id}/seat")
def add_seat(id: int, seatSchema: SeatSchemaIn, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train Not Found")

    seat = Seat(
        type=seatSchema.type,
        price=seatSchema.price,
        capacity=seatSchema.capacity,
        train_id=train.id,
    )
    db.add(seat)
    db.commit()
    db.refresh(seat)
    cache.delete("train_all")
    cache.delete(f"train_{id}")
    return {"detail": "Seat Added Successfully", "id": seat.id}


@router.delete("/seat/{id}")
def delete_seat(id: int, db: Session = Depends(get_db)):
    seat = db.query(Seat).filter(Seat.id == id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat Not Found")

    train_id = seat.train_id
    db.delete(seat)
    db.commit()
    cache.delete("train_all")
    cache.delete(f"train_{train_id}")
    return {"detail": "Seat Deleted Successfully"}


@router.get("/{train_id}/route")
def get_route(train_id: int, dflag: int, db: Session = Depends(get_db)):
    cached_key = f"route_{train_id}_{dflag}"
    cached_route_json = cache.get(cached_key)

    if cached_route_json:
        return json.loads(cached_route_json)

    train = db.query(Train).filter(Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    route = db.query(Route).filter(Route.train_id == train_id, Route.dflag == dflag).first()
    if not route:
        raise HTTPException(status_code=404, detail="No route available")

    trainroute = TrainRouteSchema2(train_id=train.id, train_name=train.name, path=[])
    trace_set = set()

    trainroute.path.append(
        PathSh2(
            source_name=route.source.name,
            destination_name=route.destination.name,
            distance=route.distance,
        )
    )
    cur_source = route.destination.id
    trace_set.add(cur_source)

    while True:
        cur_route = (
            db.query(Route)
            .filter(
                Route.source_id == cur_source,
                Route.train_id == train_id,
                Route.dflag == dflag,
            )
            .first()
        )
        if cur_route:
            trainroute.path.append(
                PathSh2(
                    source_name=cur_route.source.name,
                    destination_name=cur_route.destination.name,
                    distance=cur_route.distance,
                )
            )
        else:
            break

        if cur_route.destination.id in trace_set:
            break

        cur_source = cur_route.destination.id
        trace_set.add(cur_source)

    trainroute_json = json.dumps(trainroute.model_dump())
    cache.set(cached_key, trainroute_json)
    cache.expire(cached_key, timedelta(seconds=60))

    return trainroute
