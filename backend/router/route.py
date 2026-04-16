from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import time, timedelta
from models import Place,Route
from schemas import PlaceSchemaIn, RouteSchemaIn, RouteSchemaOut
import json
from redis_cache import cache


router = APIRouter(
    tags=["route"],
    prefix="/route"
)


@router.post("/")
def add_route(routeSchema: RouteSchemaIn, db: Session = Depends(get_db)):
    route = Route(**routeSchema.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return HTTPException(status_code=200, detail="Route Added Successfully")

def time_to_str(obj):
    if isinstance(obj, time):
        return obj.strftime("%H:%M:%S")
    raise TypeError("Type not serializable")

@router.get("/{id}", response_model=RouteSchemaOut)
def get_route(id: int, db: Session = Depends(get_db)):
   
    cached_key = f"route_{id}"

    cached_route_json = cache.get(cached_key)
    
    if cached_route_json:
        print("Cache hit")
        cached_route = json.loads(cached_route_json)
        return cached_route
    else:
        print("Cache miss")
        route = db.query(Route).filter(Route.id == id).first()
        if route:
            routeschema = RouteSchemaOut(
                id=route.id,
                source_name=route.source.name,
                destination_name=route.destination.name,
                distance=route.distance,
                leavetime=route.leavetime,
                reachtime=route.reachtime,
                train_name=route.train.name
            )

            routeschema_json = json.dumps(routeschema.model_dump(), default=time_to_str)

            cache.set(cached_key, routeschema_json)
            cache.expire(cached_key, timedelta(seconds=10))

            return routeschema
        else:
            raise HTTPException(status_code=404, detail="Route not found")