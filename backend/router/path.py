from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Route
from schemas import TrainRouteSchema1, PathSh1
from datetime import datetime, time

router = APIRouter(tags=["path"], prefix="/path")


def time_difference_in_minutes(time1, time2):
    datetime1 = datetime.combine(datetime.today(), time1)
    datetime2 = datetime.combine(datetime.today(), time2)

    # If time2 is earlier than time1, add a day to datetime2
    if datetime2 < datetime1:
        datetime2 += timedelta(days=1)

    time_difference = datetime2 - datetime1
    minutes_difference = time_difference.total_seconds() // 60

    return int(minutes_difference)


from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from redis_cache import cache
from datetime import timedelta
import json

def time_to_str(obj):
    if isinstance(obj, time):
        return obj.strftime("%H:%M:%S")
    raise TypeError("Type not serializable")

@router.get("/{source_id}/{destination_id}", response_model=List[TrainRouteSchema1])
def get_path(
    source_id: int,
    destination_id: int,
    db: Session = Depends(get_db),
):
   
    cached_key = f"path_{source_id}_{destination_id}"

    cached_routes_json = cache.get(cached_key)
    
    if cached_routes_json:
        print("Cache hit")
        cached_routes = json.loads(cached_routes_json)
        return cached_routes
    else:
        print("Cache miss")
        routes = db.query(Route).filter(Route.source_id == source_id).all()

        result_routes = []

        for route in routes:

            dflag = route.dflag

            current_route = TrainRouteSchema1(
                train_id=route.train.id, 
                train_name=route.train.name,
                dflag=dflag,
                path=[]
            )
            
            current_route.path.append(
                PathSh1(
                    source_name=route.source.name,
                    destination_name=route.destination.name,
                    distance=route.distance,
                    reachtime=route.reachtime,
                    leavetime=route.leavetime,
                    duration=time_difference_in_minutes(route.leavetime, route.reachtime),
                )
            )

            track_set = set()
            
            current_train_id = route.train.id
            current_destination_id = route.destination_id


            track_set.add(current_destination_id)

            if current_destination_id == destination_id:
                result_routes.append(current_route)
                continue
            
            while True:
                next_route = db.query(Route).filter(
                    Route.source_id == current_destination_id,
                    Route.train_id == current_train_id,
                    Route.dflag == dflag
                ).first()

               

                if not next_route:
                    break

                current_route.path.append(
                    PathSh1(
                        source_name=next_route.source.name,
                        destination_name=next_route.destination.name,
                        distance=next_route.distance,
                        leavetime=next_route.leavetime,
                        reachtime=next_route.reachtime,
                        duration=time_difference_in_minutes(next_route.leavetime, next_route.reachtime),
                    )
                )

                if next_route.destination_id == destination_id:
                    result_routes.append(current_route)
                    break

                if next_route.destination_id in track_set:
                    break

                current_destination_id = next_route.destination_id
                track_set.add(current_destination_id)   

        result_routes_json = json.dumps([r.model_dump() for r in result_routes],default=time_to_str)

        cache.set(cached_key, result_routes_json)
        cache.expire(cached_key, timedelta(seconds=60))

        return result_routes
