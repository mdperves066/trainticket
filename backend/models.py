from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql.sqltypes import Time, Date
from sqlalchemy.orm import relationship
from database import Base


class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"))
    train = relationship("Train", foreign_keys=[train_id], back_populates="seats")
    booking_logs = relationship("BookingLog", back_populates="seat", cascade="all, delete")


class Train(Base):
    __tablename__ = "trains"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    seats = relationship("Seat", back_populates="train", cascade="all, delete")


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)


class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("places.id"))
    source = relationship("Place", foreign_keys=[source_id])
    destination_id = Column(Integer, ForeignKey("places.id"))
    destination = relationship("Place", foreign_keys=[destination_id])
    distance = Column(Integer, nullable=False)
    leavetime = Column(Time, nullable=False)
    reachtime = Column(Time, nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"))
    dflag = Column(Integer, nullable=False)
    train = relationship("Train", foreign_keys=[train_id])


class BookingLog(Base):
    __tablename__ = "booking_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"))
    seat = relationship("Seat", foreign_keys=[seat_id], back_populates="booking_logs")
    dflag = Column(Integer, nullable=False)
    available = Column(Integer, nullable=False)
    booked = Column(Integer, nullable=False)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="USER")
    img_data = Column(String, nullable=True)
    nid = Column(String, nullable=False)
    location = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    tickets = relationship("Ticket", back_populates="user", cascade="all, delete")


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=True)
    train_name = Column(String, nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=True)
    seat_type = Column(String, nullable=False)
    seat_numbers = Column(String, nullable=False)  # comma-separated e.g. "1, 2"
    from_station = Column(String, nullable=False)
    to_station = Column(String, nullable=False)
    journey_date = Column(Date, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    total_price = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False, default=1)
    dflag = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="CONFIRMED")  # CONFIRMED or CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tickets")


class PasswordCode(Base):
    __tablename__ = "password_codes"
    email = Column(String, primary_key=True, index=True)
    code = Column(String, nullable=False)


class WatchJob(Base):
    __tablename__ = "watch_jobs"
    id = Column(String, primary_key=True, index=True)  # UUID
    from_station = Column(String, nullable=False, index=True)
    to_station = Column(String, nullable=False, index=True)
    journey_date = Column(String, nullable=False, index=True)
    passenger_count = Column(Integer, nullable=False, default=1)
    selected_trains = Column(String, nullable=False, default='["ALL"]')  # JSON encoded list
    selected_classes = Column(String, nullable=False, default='["ALL"]')  # JSON encoded list
    monitoring_enabled = Column(Integer, nullable=False, default=0)
    current_status = Column(String, nullable=False, default="STOPPED")  # STOPPED, RUNNING, WAITING_FOR_LOGIN, MANUAL_ACTION_REQUIRED, BACKOFF, ERROR
    last_check_at = Column(DateTime, nullable=True)
    next_check_at = Column(DateTime, nullable=True)
    current_availability = Column(String, nullable=True)  # JSON encoded current availability snapshot
    last_error = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    snapshots = relationship("AvailabilitySnapshot", back_populates="watch", cascade="all, delete-orphan")
    alerts = relationship("AlertEvent", back_populates="watch", cascade="all, delete-orphan")


class AvailabilitySnapshot(Base):
    __tablename__ = "availability_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    watch_id = Column(String, ForeignKey("watch_jobs.id"), nullable=False, index=True)
    train_name = Column(String, nullable=False, index=True)
    class_name = Column(String, nullable=False, index=True)
    availability = Column(Integer, nullable=False, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    parser_confidence = Column(String, nullable=False, default="HIGH")  # HIGH, MEDIUM, LOW, UNCERTAIN
    raw_source_label = Column(String, nullable=True)
    status = Column(String, nullable=False, default="AVAILABLE")  # AVAILABLE, SOLD_OUT, UNCERTAIN, PARSE_ERROR

    watch = relationship("WatchJob", back_populates="snapshots")


class AlertEvent(Base):
    __tablename__ = "alert_events"
    id = Column(Integer, primary_key=True, index=True)
    watch_id = Column(String, ForeignKey("watch_jobs.id"), nullable=False, index=True)
    train = Column(String, nullable=False, index=True)
    class_name = Column(String, nullable=False, index=True)
    previous_availability = Column(Integer, nullable=False, default=0)
    current_availability = Column(Integer, nullable=False, default=0)
    event_type = Column(String, nullable=False, index=True)  # SEAT_AVAILABLE, SEAT_SOLD_OUT, SESSION_EXPIRED, LOGIN_REQUIRED, CAPTCHA_REQUIRED, PARSE_ERROR, NETWORK_ERROR, WORKER_STARTED, WORKER_STOPPED
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    notified_telegram = Column(Integer, nullable=False, default=0)
    details = Column(String, nullable=True)

    watch = relationship("WatchJob", back_populates="alerts")