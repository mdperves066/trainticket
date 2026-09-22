# Bangladesh Railway E-Ticketing System 🚆

A complete, production-ready, full-stack **Railway Reservation & Online Ticket Booking Application** built with **Next.js 14**, **FastAPI**, **SQLAlchemy**, and **Tailwind CSS**.

---

## ✨ Features

### 🎫 User & Booking Features
- **Smart Train Search**: Autocomplete stations across Bangladesh (Dhaka, Chittagong, Cox's Bazar, Sylhet, Rajshahi, etc.) and date selection.
- **Route & Pathfinding**: Multi-segment routing algorithm that computes exact distances, arrival/departure times, and trip durations.
- **Real-Time Seat Availability**: Real-time seat inventory for Shovon Chair, Snigdha (AC Chair), AC Berth, and Cabin classes.
- **Instant Digital PDF Tickets**: Generates official Bangladesh Railway branded PDF tickets client-side with barcode styling, passenger details, seat numbers, and journey schedule.
- **Complete Booking History**: User dashboard tracking active and past bookings with real-time status badges (`CONFIRMED` or `CANCELLED`).
- **Reservation Cancellation**: Self-service ticket cancellation that instantly restores seat availability to the inventory.

### 🔒 Security & Performance
- **Resilient Caching**: Redis caching for fast station/route lookup, with an automated in-memory fallback if Redis is offline.
- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing.
- **Zero-Setup Database**: Automatic SQLite fallback (`railway.db`) out-of-the-box for instant local testing, with full PostgreSQL support for production.
- **Automated Database Seeder**: Comes with pre-loaded realistic Bangladesh Railway stations, express trains (Subarna, Sonar Bangla, Cox's Bazar Express, Parabat, Silk City), schedules, seat categories, and a demo user.

---

## 🏗 Project Architecture

```
├── backend/                  # FastAPI Backend API
│   ├── database.py           # Database engine (SQLite/PostgreSQL hybrid)
│   ├── main.py               # FastAPI application & router registration
│   ├── models.py             # SQLAlchemy models (User, Ticket, Train, Seat, Route, etc.)
│   ├── oauth2.py             # JWT authentication & authorization
│   ├── redis_cache.py        # Resilient caching layer (Redis + Memory fallback)
│   ├── router/               # API endpoints (auth, booking, path, place, route, train, user)
│   ├── schemas.py            # Pydantic v2 schemas
│   ├── seed.py               # Bangladesh Railway database seeder
│   └── test_api.py           # End-to-end API test suite
│
├── frontend/                 # Next.js 14 Web Application
│   ├── app/                  # App Router pages (book_tickets, profile, signin, signup, etc.)
│   ├── components/           # UI Components (Profile with Booking History, TrainSearch, etc.)
│   └── utility/              # Helpers (GenerateTicketPDF, FormatDate, etc.)
│
├── run_backend.bat           # One-click Windows runner for Backend
├── run_frontend.bat          # One-click Windows runner for Frontend
└── seed_database.bat         # One-click Database Seeder
```

---

## ⚡ Quick Start (Ready to Run)

### Method 1: One-Click Launch (Windows)

1. Double-click `run_backend.bat` to seed the database and start the FastAPI server on `http://localhost:8000`.
2. Double-click `run_frontend.bat` to start the Next.js frontend on `http://localhost:3000`.
3. Open `http://localhost:3000` in your browser!

---

### Method 2: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Seed initial Bangladesh Railway data (Stations, Trains, Routes & Demo User):
python seed.py

# Start FastAPI server:
uvicorn main:app --reload --port 8000
```
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 👤 Default Demo Credentials

You can sign in immediately using the pre-seeded passenger account:
- **Email:** `demo@railway.gov.bd`
- **Password:** `password123`

---

## 🧪 Testing Backend Endpoints

Run the automated test suite verifying auth, booking, PDF data generation, and ticket cancellation:
```bash
cd backend
python test_api.py
```

---

## 📄 License
MIT License
