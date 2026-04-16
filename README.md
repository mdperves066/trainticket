# BD Train Online Booking System

A comprehensive train ticket booking platform featuring a Next.js frontend and a FastAPI backend.

## 🏗 Project Structure

This is a monorepo containing both the frontend and backend services:

- **[frontend/](./frontend)**: Next.js application (React, TypeScript, Tailwind CSS).
- **[backend/](./backend)**: FastAPI application (Python, SQLAlchemy, PostgreSQL).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **PostgreSQL** (Running locally with a database named `railway`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies (standard FastAPI stack):
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 🛠 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)

## 📝 Features

- User Authentication (Login/Sign-up)
- Train Search and Route Selection
- Seat Booking and Ticket Generation (PDF)
- Profile Management
- Admin functionality for managing trains and paths

---

## 📄 License

[MIT](LICENSE)
