from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import BookingLog,Seat,Train
from schemas import AvailSeat
from datetime import date,time, timedelta
from redis_cache import cache
import json

router = APIRouter(tags=["booking"], prefix="/booking")

@router.get("/train/{train_id}/available/seats")
def get_available_seats(train_id: int,dflag:int, date: date, db: Session = Depends(get_db)):
   
    cached_key = f"available_seats_{train_id}_{date}_{dflag}"

    
    cached_seats_json = cache.get(cached_key)

    if cached_seats_json:
        print("Cache hit")
        cached_seats = json.loads(cached_seats_json)
        return cached_seats
    else:
        print("Cache miss")
        train = db.query(Train).filter(Train.id == train_id).first()
        if train:
            seats = train.seats
            available = []
            for seat in seats:
                booking_log = db.query(BookingLog).filter(BookingLog.date == date, BookingLog.seat_id == seat.id,BookingLog.dflag==dflag).first()
                if (booking_log and booking_log.available>0):
                    available.append(AvailSeat(id=seat.id, type=seat.type, price=seat.price, available=booking_log.available))
                else:
                    booking_log = BookingLog(date=date, seat_id=seat.id, available=seat.capacity, booked=0,dflag=dflag)
                    db.add(booking_log)
                    db.commit()
                    db.refresh(booking_log)
                    available.append(AvailSeat(id=seat.id, type=seat.type, price=seat.price, available=booking_log.available))

            available_json = json.dumps([a.model_dump() for a in available])

            cache.set(cached_key, available_json)
            cache.expire(cached_key, timedelta(seconds=15))

            return available
        else:
            raise HTTPException(status_code=404, detail="Train Not Found")
        


@router.put("/seat/{id}",status_code=200)
def book_seat(id:int,dflag:int,date:date,count:int,db:Session=Depends(get_db)):
    booking_log=db.query(BookingLog).filter(BookingLog.seat_id==id,BookingLog.date==date,BookingLog.dflag==dflag).first()
    if booking_log:
        if booking_log.available>=count:
            seat_numbers =[]
            for i in range(count):
                seat_numbers.append(booking_log.booked+i+1)

                seat_name = booking_log.seat.type

                train_name = booking_log.seat.train.name

            booking_log.available-=count
            booking_log.booked+=count
            db.commit()
            
            return {
                "seat_name":seat_name,
                "train_name":train_name,
                "seat_numbers":seat_numbers
            }
        else:
            return HTTPException(status_code=400,detail="Seat Not Available")
    else:
        return HTTPException(status_code=404,detail="Booking Log Not Found")