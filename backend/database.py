import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sqlAlchemyDatabaseUrl = os.getenv("DATABASE_URL")

# Fallback to local SQLite if DATABASE_URL is not set or empty, anchored to backend folder
if not sqlAlchemyDatabaseUrl or sqlAlchemyDatabaseUrl.strip() == "":
    default_db = os.path.join(BASE_DIR, "railway.db").replace("\\", "/")
    sqlAlchemyDatabaseUrl = f"sqlite:///{default_db}"
elif sqlAlchemyDatabaseUrl.startswith("sqlite:///./"):
    db_filename = sqlAlchemyDatabaseUrl.replace("sqlite:///./", "")
    anchored_db = os.path.join(BASE_DIR, db_filename).replace("\\", "/")
    sqlAlchemyDatabaseUrl = f"sqlite:///{anchored_db}"

if sqlAlchemyDatabaseUrl.startswith("sqlite"):
    engine = create_engine(sqlAlchemyDatabaseUrl, connect_args={"check_same_thread": False})
else:
    engine = create_engine(sqlAlchemyDatabaseUrl)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()