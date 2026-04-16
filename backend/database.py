from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

sqlAlchemyDatabaseUrl = "postgresql://araf:password@localhost:5432/railway"


engine = create_engine(sqlAlchemyDatabaseUrl)

SessionLocal = sessionmaker(autocommit =False, autoflush= False, bind= engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()