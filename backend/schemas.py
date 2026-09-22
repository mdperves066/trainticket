from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime, time


class SeatSchemaOut(BaseModel):
    id: int
    type: str
    price: int
    capacity: int

    model_config = {"from_attributes": True}


class TrainSchemaOut(BaseModel):
    id: int
    name: str
    seats: List[SeatSchemaOut]

    model_config = {"from_attributes": True}


class SeatSchemaIn(BaseModel):
    type: str
    price: int
    capacity: int

    model_config = {"from_attributes": True}


class TrainSchemaIn(BaseModel):
    name: str

    model_config = {"from_attributes": True}


class PlaceSchemaIn(BaseModel):
    name: str

    model_config = {"from_attributes": True}


class PlaceSchemaOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class RouteSchemaIn(BaseModel):
    source_id: int
    destination_id: int
    distance: int
    leavetime: time
    reachtime: time
    train_id: int
    dflag: int = 0


class RouteSchemaOut(BaseModel):
    id: int
    source_name: str
    destination_name: str
    distance: int
    leavetime: time
    reachtime: time
    train_name: str

    model_config = {"from_attributes": True}


class PathSh1(BaseModel):
    source_name: str
    destination_name: str
    distance: int
    leavetime: time
    reachtime: time
    duration: int

    model_config = {"from_attributes": True}


class PathSh2(BaseModel):
    source_name: str
    destination_name: str
    distance: int

    model_config = {"from_attributes": True}


class TrainRouteSchema1(BaseModel):
    train_id: int
    train_name: str
    dflag: int
    path: List[PathSh1]

    model_config = {"from_attributes": True}


class TrainRouteSchema2(BaseModel):
    train_id: int
    train_name: str
    path: List[PathSh2]

    model_config = {"from_attributes": True}


class AvailSeat(BaseModel):
    id: int
    type: str
    price: int
    available: int

    model_config = {"from_attributes": True}


class UserSignUp(BaseModel):
    name: str
    email: str
    role: str = "USER"
    img_data: Optional[str] = None
    password: str
    nid: str
    location: str
    phone: str

    model_config = {"from_attributes": True}


class UserSignIn(BaseModel):
    email: str
    password: str

    model_config = {"from_attributes": True}


class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    role: str
    nid: str
    location: str
    phone: str
    img_data: Optional[str] = None

    model_config = {"from_attributes": True}


class PasswordCodeSchema(BaseModel):
    email: str
    code: str

    model_config = {"from_attributes": True}


class ResetPasswordSchema(BaseModel):
    email: str
    password: str

    model_config = {"from_attributes": True}


class TrainPlaceSchemaOut(BaseModel):
    id: int
    name: str
    incoming_arrival: time
    outgoing_arrival: time
    incoming_departure: time
    outgoing_departure: time

    model_config = {"from_attributes": True}


class TicketCreateSchema(BaseModel):
    train_id: Optional[int] = None
    train_name: str
    seat_id: Optional[int] = None
    seat_type: str
    seat_numbers: List[int]
    from_station: str
    to_station: str
    journey_date: date
    departure_time: str
    arrival_time: str
    total_price: int
    count: int = 1
    dflag: int = 0


class TicketResponseSchema(BaseModel):
    id: int
    user_id: int
    train_id: Optional[int] = None
    train_name: str
    seat_id: Optional[int] = None
    seat_type: str
    seat_numbers: str
    from_station: str
    to_station: str
    journey_date: date
    departure_time: str
    arrival_time: str
    total_price: int
    count: int
    dflag: int
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Bangladesh Railway Monitoring Schemas ---

class SeatAvailabilityItem(BaseModel):
    train_name: str
    class_name: str
    available_count: int
    fare: Optional[int] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    status: str = "AVAILABLE"  # AVAILABLE, SOLD_OUT, UNCERTAIN, PARSE_ERROR
    raw_source_label: Optional[str] = None


class SearchResultOut(BaseModel):
    from_station: str
    to_station: str
    journey_date: str
    passenger_count: int
    source: str  # LIVE, MOCK
    items: List[SeatAvailabilityItem]
    timestamp: str
    error: Optional[str] = None


class WatchJobCreate(BaseModel):
    from_station: str
    to_station: str
    journey_date: str
    passenger_count: int = 1
    selected_trains: List[str] = ["ALL"]
    selected_classes: List[str] = ["ALL"]


class WatchJobUpdate(BaseModel):
    from_station: Optional[str] = None
    to_station: Optional[str] = None
    journey_date: Optional[str] = None
    passenger_count: Optional[int] = None
    selected_trains: Optional[List[str]] = None
    selected_classes: Optional[List[str]] = None
    monitoring_enabled: Optional[bool] = None


class WatchJobOut(BaseModel):
    id: str
    from_station: str
    to_station: str
    journey_date: str
    passenger_count: int
    selected_trains: List[str]
    selected_classes: List[str]
    monitoring_enabled: bool
    current_status: str
    last_check_at: Optional[datetime] = None
    next_check_at: Optional[datetime] = None
    current_availability: Optional[dict] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AvailabilitySnapshotOut(BaseModel):
    id: int
    watch_id: str
    train_name: str
    class_name: str
    availability: int
    timestamp: datetime
    parser_confidence: str
    raw_source_label: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: int
    watch_id: str
    train: str
    class_name: str
    previous_availability: int
    current_availability: int
    event_type: str
    detected_at: datetime
    acknowledged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    notified_telegram: bool
    details: Optional[str] = None

    model_config = {"from_attributes": True}