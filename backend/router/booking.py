from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import BookingLog, Seat, Train, Ticket, User
from schemas import AvailSeat, TicketCreateSchema, TicketResponseSchema
from datetime import date, timedelta
from redis_cache import cache
import json
import oauth2

router = APIRouter(tags=["booking"], prefix="/booking")


@router.get("/train/{train_id}/available/seats")
def get_available_seats(train_id: int, dflag: int, date: date, db: Session = Depends(get_db)):
    cached_key = f"available_seats_{train_id}_{date}_{dflag}"
    cached_seats_json = cache.get(cached_key)

    if cached_seats_json:
        return json.loads(cached_seats_json)
    
    train = db.query(Train).filter(Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train Not Found")

    seats = train.seats
    available = []
    for seat in seats:
        booking_log = (
            db.query(BookingLog)
            .filter(
                BookingLog.date == date,
                BookingLog.seat_id == seat.id,
                BookingLog.dflag == dflag,
            )
            .first()
        )
        if booking_log and booking_log.available > 0:
            available.append(
                AvailSeat(
                    id=seat.id,
                    type=seat.type,
                    price=seat.price,
                    available=booking_log.available,
                )
            )
        elif not booking_log:
            booking_log = BookingLog(
                date=date,
                seat_id=seat.id,
                available=seat.capacity,
                booked=0,
                dflag=dflag,
            )
            db.add(booking_log)
            db.commit()
            db.refresh(booking_log)
            available.append(
                AvailSeat(
                    id=seat.id,
                    type=seat.type,
                    price=seat.price,
                    available=booking_log.available,
                )
            )
        else:
            # 0 seats available
            available.append(
                AvailSeat(
                    id=seat.id,
                    type=seat.type,
                    price=seat.price,
                    available=0,
                )
            )

    available_json = json.dumps([a.model_dump() for a in available])
    cache.set(cached_key, available_json)
    cache.expire(cached_key, timedelta(seconds=15))

    return available


@router.put("/seat/{id}", status_code=200)
def book_seat(id: int, dflag: int, date: date, count: int, db: Session = Depends(get_db)):
    booking_log = (
        db.query(BookingLog)
        .filter(
            BookingLog.seat_id == id,
            BookingLog.date == date,
            BookingLog.dflag == dflag,
        )
        .first()
    )

    if not booking_log:
        # If no booking log exists yet, initialize it from seat capacity
        seat = db.query(Seat).filter(Seat.id == id).first()
        if not seat:
            raise HTTPException(status_code=404, detail="Seat Not Found")
        booking_log = BookingLog(
            date=date,
            seat_id=seat.id,
            available=seat.capacity,
            booked=0,
            dflag=dflag,
        )
        db.add(booking_log)
        db.commit()
        db.refresh(booking_log)

    if booking_log.available < count:
        raise HTTPException(status_code=400, detail="Seat Not Available")

    seat_numbers = []
    for i in range(count):
        seat_numbers.append(booking_log.booked + i + 1)

    seat_name = booking_log.seat.type
    train_name = booking_log.seat.train.name
    train_id = booking_log.seat.train_id

    booking_log.available -= count
    booking_log.booked += count
    db.commit()

    # Invalidate cache for available seats
    cached_key = f"available_seats_{train_id}_{date}_{dflag}"
    cache.delete(cached_key)

    return {
        "seat_name": seat_name,
        "train_name": train_name,
        "seat_numbers": seat_numbers,
        "seat_id": id,
        "train_id": train_id,
    }


@router.post("/ticket", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
def create_user_ticket(
    ticket_in: TicketCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    seat_str = ", ".join(map(str, ticket_in.seat_numbers))
    new_ticket = Ticket(
        user_id=current_user.id,
        train_id=ticket_in.train_id,
        train_name=ticket_in.train_name,
        seat_id=ticket_in.seat_id,
        seat_type=ticket_in.seat_type,
        seat_numbers=seat_str,
        from_station=ticket_in.from_station,
        to_station=ticket_in.to_station,
        journey_date=ticket_in.journey_date,
        departure_time=ticket_in.departure_time,
        arrival_time=ticket_in.arrival_time,
        total_price=ticket_in.total_price,
        count=ticket_in.count,
        dflag=ticket_in.dflag,
        status="CONFIRMED",
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


@router.get("/user/my-tickets", response_model=List[TicketResponseSchema])
def get_user_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.id.desc())
        .all()
    )
    return tickets


@router.put("/ticket/{ticket_id}/cancel")
def cancel_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id, Ticket.user_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Ticket is already cancelled")

    ticket.status = "CANCELLED"

    # Restore seats in BookingLog
    if ticket.seat_id:
        booking_log = (
            db.query(BookingLog)
            .filter(
                BookingLog.seat_id == ticket.seat_id,
                BookingLog.date == ticket.journey_date,
                BookingLog.dflag == ticket.dflag,
            )
            .first()
        )
        if booking_log:
            booking_log.available += ticket.count
            booking_log.booked = max(0, booking_log.booked - ticket.count)

        if ticket.train_id:
            cached_key = f"available_seats_{ticket.train_id}_{ticket.journey_date}_{ticket.dflag}"
            cache.delete(cached_key)

    db.commit()

    return {
        "detail": "Ticket Cancelled Successfully",
        "ticket_id": ticket.id,
        "status": "CANCELLED",
    }