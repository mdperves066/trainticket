from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import time, timedelta
from models import Place, Route
from schemas import RouteSchemaIn, RouteSchemaOut
import json
from redis_cache import cache

router = APIRouter(tags=["route"], prefix="/route")


@router.post("/")
def add_route(routeSchema: RouteSchemaIn, db: Session = Depends(get_db)):
    route = Route(**routeSchema.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return {"detail": "Route Added Successfully", "id": route.id}


def time_to_str(obj):
    if isinstance(obj, time):
        return obj.strftime("%H:%M:%S")
    raise TypeError("Type not serializable")


@router.get("/{id}", response_model=RouteSchemaOut)
def get_route(id: int, db: Session = Depends(get_db)):
    cached_key = f"route_{id}"
    cached_route_json = cache.get(cached_key)

    if cached_route_json:
        return json.loads(cached_route_json)
    
    route = db.query(Route).filter(Route.id == id).first()
    if route:
        routeschema = RouteSchemaOut(
            id=route.id,
            source_name=route.source.name if route.source else "",
            destination_name=route.destination.name if route.destination else "",
            distance=route.distance,
            leavetime=route.leavetime,
            reachtime=route.reachtime,
            train_name=route.train.name if route.train else "",
        )

        routeschema_json = json.dumps(routeschema.model_dump(), default=time_to_str)
        cache.set(cached_key, routeschema_json)
        cache.expire(cached_key, timedelta(seconds=10))

        return routeschema
    else:
        raise HTTPException(status_code=404, detail="Route not found")