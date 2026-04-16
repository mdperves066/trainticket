# BD Train Online Booking (Practice Project)

A simple train ticket booking application built as a practice project while learning Next.js. It features a Next.js frontend and a FastAPI backend to handle basic railway reservation logic.

## ✨ Features

### Client Features
- **Smart Search**: Find trains based on departure/arrival locations and preferred dates.
- **Seat Selection**: Interactive seat selection with real-time availability.
- **Dynamic Routing**: Sophisticated pathfinding to identify best routes between stations.
- **Ticket Generation**: Automatic generation of booking logs and digital tickets.
- **User Dashboard**: Manage profiles, view booking history, and cancel reservations.

### Security & Performance
- **Secure Auth**: JWT-based authentication with password hashing.
- **Fast Caching**: Redis-backed caching for route and station data.
- **CORS Handling**: Ready for cross-origin frontend-backend interaction.
- **Data Integrity**: Enforced via SQLAlchemy models and PostgreSQL.

## 🏗 Project Architecture

This is a monorepo structured as follows:

| Component | Path | Description |
| :--- | :--- | :--- |
| **Frontend** | [`/frontend`](./frontend) | Next.js, Tailwind CSS, TypeScript |
| **Backend** | [`/backend`](./backend) | Python, FastAPI, PostgreSQL, Redis |

---

## 🚀 Getting Started

To get the project running locally, please follow the setup guides in the respective directories:

1. **Backend Setup**: Follow the instructions in [backend/README.md](./backend/README.md)
2. **Frontend Setup**: Follow the instructions in [frontend/README.md](./frontend/README.md)

---

## 🛠 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/)
- **Cache**: [Redis](https://redis.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)

## 📄 License
[MIT](LICENSE)
