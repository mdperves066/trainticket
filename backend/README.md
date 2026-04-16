# Backend - BD Train Online Booking

This is the Python/FastAPI backend API for the Railway Reservation System.

## 🚀 Getting Started

### Prerequisites
- **Python**: v3.9 or later
- **PostgreSQL**: Local instance running
- **Redis**: Local instance running (optional but recommended for caching)

### Installation

1. **Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup Environment**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Database Setup**:
   Ensure you have a PostgreSQL database named `railway`. The tables will be auto-generated on the first run.

5. **Run API Server**:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at [http://localhost:8000](http://localhost:8000).

---

## 🛠 Stack
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (Jose)
