# Backend - Bangladesh Railway Online Booking

High-performance FastAPI REST API for the Bangladesh Railway Reservation System.

## 🚀 Features
- **Zero-Configuration SQLite Fallback**: Runs out of the box using local `railway.db` with no PostgreSQL installation required.
- **PostgreSQL Production Ready**: Easily switch to PostgreSQL by defining `DATABASE_URL` in `.env`.
- **Resilient Caching**: Redis caching with seamless in-memory fallback if Redis is offline.
- **JWT & Password Security**: Industry-standard bcrypt password hashing and token validation.
- **Self-Seeding Data**: `seed.py` populates real stations, trains, and routes across Bangladesh.
- **Reservation & Cancellation**: Full database tracking of user tickets, available seats, and cancellation handling.

## 📦 Setup & Run

### 1. Virtual Environment & Dependencies
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration
The `.env` file defaults to SQLite for zero friction:
```env
DATABASE_URL=sqlite:///./railway.db
REDIS_HOST=localhost
REDIS_PORT=6379
SECRET_KEY=bd_railway_secret_key_super_secure_jwt_token_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Seed Sample Railway Data
```bash
python seed.py
```

### 4. Run API Server
```bash
uvicorn main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Swagger Interactive Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

### 5. Automated Tests
```bash
python test_api.py
```
