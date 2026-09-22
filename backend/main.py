import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from router import route, train, path, booking, auth, user, place
from router import watch, alerts, session, diagnostics, stations_trains
from services.watch_scheduler import scheduler


models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    models.Base.metadata.create_all(bind=engine)

    yield
    # Graceful shutdown
    await scheduler.shutdown()


app = FastAPI(
    title="Bangladesh Railway E-Ticket Availability Monitoring Assistant",
    description="Personal-use availability monitoring assistant powered by real-time official portal checks and resilient alerts.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "service": "Bangladesh Railway E-Ticket Availability Monitoring Assistant",
        "official_source": "https://eticket.railway.gov.bd/",
        "mode": scheduler.mode,
        "docs": "/docs",
        "health": "/health",
    }


# Monitoring & Real-time Routers (Primary)
app.include_router(diagnostics.router)
app.include_router(stations_trains.router)
app.include_router(watch.router)
app.include_router(alerts.router)
app.include_router(session.router)

# Legacy / Secondary Routers
app.include_router(auth.router)
app.include_router(train.router)
app.include_router(route.router)
app.include_router(path.router)
app.include_router(booking.router)
app.include_router(user.router)
app.include_router(place.router)
