import os
import sys
from datetime import time, date

# Ensure backend folder is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
import models
import utils

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        place_count = db.query(models.Place).count()
        if place_count > 0:
            print(f"Database already has {place_count} stations. Skipping full re-seed.")
            return

        print("Seeding Bangladesh Railway stations...")
        station_names = [
            "Dhaka",
            "Dhaka Airport",
            "Chittagong",
            "Cox's Bazar",
            "Sylhet",
            "Rajshahi",
            "Khulna",
            "Comilla",
            "Feni",
            "Sreemangal",
            "Bogura"
        ]

        station_map = {}
        for name in station_names:
            place = models.Place(name=name)
            db.add(place)
            db.flush()
            station_map[name] = place.id
            print(f"  + Added station: {name} (ID: {place.id})")

        print("\nSeeding Trains & Seat Classes...")
        trains_data = [
            {
                "name": "Subarna Express (701/702)",
                "seats": [
                    {"type": "Shovon Chair", "price": 405, "capacity": 60},
                    {"type": "Snigdha (AC)", "price": 777, "capacity": 50},
                    {"type": "AC Cabin", "price": 1150, "capacity": 20},
                ],
            },
            {
                "name": "Sonar Bangla Express (787/788)",
                "seats": [
                    {"type": "Shovon Chair", "price": 405, "capacity": 60},
                    {"type": "Snigdha (AC)", "price": 777, "capacity": 50},
                    {"type": "AC Cabin", "price": 1150, "capacity": 20},
                ],
            },
            {
                "name": "Cox's Bazar Express (813/814)",
                "seats": [
                    {"type": "Shovon Chair", "price": 695, "capacity": 70},
                    {"type": "Snigdha (AC)", "price": 1325, "capacity": 50},
                    {"type": "AC Berth", "price": 1850, "capacity": 30},
                ],
            },
            {
                "name": "Parabat Express (709/710)",
                "seats": [
                    {"type": "Shovon Chair", "price": 375, "capacity": 60},
                    {"type": "Snigdha (AC)", "price": 720, "capacity": 45},
                ],
            },
            {
                "name": "Silk City Express (753/754)",
                "seats": [
                    {"type": "Shovon Chair", "price": 360, "capacity": 60},
                    {"type": "Snigdha (AC)", "price": 690, "capacity": 45},
                ],
            },
        ]

        train_map = {}
        for t in trains_data:
            train = models.Train(name=t["name"])
            db.add(train)
            db.flush()
            train_map[t["name"]] = train.id
            print(f"  + Added train: {train.name} (ID: {train.id})")

            for s in t["seats"]:
                seat = models.Seat(
                    type=s["type"],
                    price=s["price"],
                    capacity=s["capacity"],
                    train_id=train.id,
                )
                db.add(seat)
            db.flush()

        print("\nSeeding Routes & Schedules...")
        routes_data = [
            # Subarna Express Outgoing (Dhaka -> Chittagong)
            {
                "train": "Subarna Express (701/702)", "dflag": 0,
                "segments": [
                    ("Dhaka", "Dhaka Airport", 20, time(16, 30), time(16, 55)),
                    ("Dhaka Airport", "Comilla", 110, time(17, 0), time(19, 0)),
                    ("Comilla", "Feni", 55, time(19, 5), time(20, 0)),
                    ("Feni", "Chittagong", 75, time(20, 5), time(21, 30)),
                ]
            },
            # Subarna Express Incoming (Chittagong -> Dhaka)
            {
                "train": "Subarna Express (701/702)", "dflag": 1,
                "segments": [
                    ("Chittagong", "Feni", 75, time(7, 0), time(8, 20)),
                    ("Feni", "Comilla", 55, time(8, 25), time(9, 15)),
                    ("Comilla", "Dhaka Airport", 110, time(9, 20), time(11, 20)),
                    ("Dhaka Airport", "Dhaka", 20, time(11, 25), time(12, 0)),
                ]
            },
            # Cox's Bazar Express Outgoing (Dhaka -> Cox's Bazar)
            {
                "train": "Cox's Bazar Express (813/814)", "dflag": 0,
                "segments": [
                    ("Dhaka", "Dhaka Airport", 20, time(22, 30), time(22, 55)),
                    ("Dhaka Airport", "Chittagong", 240, time(23, 0), time(4, 0)),
                    ("Chittagong", "Cox's Bazar", 150, time(4, 15), time(6, 40)),
                ]
            },
            # Cox's Bazar Express Incoming (Cox's Bazar -> Dhaka)
            {
                "train": "Cox's Bazar Express (813/814)", "dflag": 1,
                "segments": [
                    ("Cox's Bazar", "Chittagong", 150, time(12, 30), time(15, 0)),
                    ("Chittagong", "Dhaka Airport", 240, time(15, 20), time(20, 20)),
                    ("Dhaka Airport", "Dhaka", 20, time(20, 25), time(21, 0)),
                ]
            },
            # Parabat Express Outgoing (Dhaka -> Sylhet)
            {
                "train": "Parabat Express (709/710)", "dflag": 0,
                "segments": [
                    ("Dhaka", "Dhaka Airport", 20, time(6, 20), time(6, 45)),
                    ("Dhaka Airport", "Sreemangal", 175, time(6, 50), time(10, 15)),
                    ("Sreemangal", "Sylhet", 85, time(10, 20), time(12, 45)),
                ]
            },
            # Parabat Express Incoming (Sylhet -> Dhaka)
            {
                "train": "Parabat Express (709/710)", "dflag": 1,
                "segments": [
                    ("Sylhet", "Sreemangal", 85, time(15, 45), time(17, 50)),
                    ("Sreemangal", "Dhaka Airport", 175, time(17, 55), time(21, 20)),
                    ("Dhaka Airport", "Dhaka", 20, time(21, 25), time(22, 0)),
                ]
            },
            # Silk City Express Outgoing (Dhaka -> Rajshahi)
            {
                "train": "Silk City Express (753/754)", "dflag": 0,
                "segments": [
                    ("Dhaka", "Dhaka Airport", 20, time(14, 40), time(15, 5)),
                    ("Dhaka Airport", "Bogura", 195, time(15, 10), time(19, 30)),
                    ("Bogura", "Rajshahi", 110, time(19, 35), time(21, 30)),
                ]
            },
            # Silk City Express Incoming (Rajshahi -> Dhaka)
            {
                "train": "Silk City Express (753/754)", "dflag": 1,
                "segments": [
                    ("Rajshahi", "Bogura", 110, time(7, 40), time(9, 35)),
                    ("Bogura", "Dhaka Airport", 195, time(9, 40), time(14, 0)),
                    ("Dhaka Airport", "Dhaka", 20, time(14, 5), time(14, 35)),
                ]
            },
        ]

        for r_group in routes_data:
            train_id = train_map[r_group["train"]]
            dflag = r_group["dflag"]
            for src_name, dst_name, dist, ltime, rtime in r_group["segments"]:
                route = models.Route(
                    source_id=station_map[src_name],
                    destination_id=station_map[dst_name],
                    distance=dist,
                    leavetime=ltime,
                    reachtime=rtime,
                    train_id=train_id,
                    dflag=dflag,
                )
                db.add(route)
            print(f"  + Added route segments for {r_group['train']} (dflag={dflag})")

        print("\nSeeding Default Demo User...")
        demo_user = models.User(
            name="Demo Passenger",
            email="demo@railway.gov.bd",
            password=utils.hash("password123"),
            role="USER",
            nid="19951234567890",
            location="Dhaka, Bangladesh",
            phone="01712345678",
            img_data="",
        )
        db.add(demo_user)

        db.commit()
        print("\nSuccessfully seeded Bangladesh Railway database!")
        print("Demo User Credentials:")
        print("  Email:    demo@railway.gov.bd")
        print("  Password: password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
