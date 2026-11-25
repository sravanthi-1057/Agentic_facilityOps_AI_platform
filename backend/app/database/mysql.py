import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.database.models import Base

logger = logging.getLogger("facilityops.database")

engine = None
SessionLocal = None
active_db_type = "UNKNOWN"
db_status_detail = ""

def init_sql_database():
    """
    Initializes SQL database connection.
    Attempts MySQL connection first; falls back to SQLite development database
    if MySQL is not reachable or credentials are not active.
    """
    global engine, SessionLocal, active_db_type, db_status_detail

    # Try MySQL if credentials / host configured
    mysql_url = f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"
    
    try:
        test_engine = create_engine(mysql_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        active_db_type = "MySQL"
        db_status_detail = f"Connected to MySQL ({settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE})"
        logger.info(db_status_detail)
    except Exception as e:
        logger.warning(f"MySQL connection failed ({e}). Falling back to local SQLite development database.")
        sqlite_url = f"sqlite:///{settings.SQLITE_DB_PATH}"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        active_db_type = "SQLite (Fallback)"
        db_status_detail = f"Using SQLite Fallback at {settings.SQLITE_DB_PATH} (MySQL server offline)"
        logger.info(db_status_detail)

    # Create tables
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

def get_db_session() -> Session:
    """Helper returning a new DB session, initializing DB if necessary."""
    global SessionLocal
    if SessionLocal is None:
        init_sql_database()
    return SessionLocal()

def get_db():
    """FastAPI dependency for DB sessions."""
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

def get_db_status():
    return {
        "engine": active_db_type,
        "detail": db_status_detail,
        "is_production_mysql": active_db_type == "MySQL"
    }

# Ensure initialization on import
init_sql_database()
