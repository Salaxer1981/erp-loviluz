import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. BUSCAR URL DE LA NUBE O USAR LOCAL
# Si existe la variable 'DATABASE_URL' (en la nube), la usa.
# Si no, usa 'sqlite:///./crm_database.db' (en tu PC).
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm_database.db")

# 2. CORRECCIÓN PARA RENDER
# Render a veces da la URL empezando por "postgres://", pero SQLAlchemy necesita "postgresql://"
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. CREAR EL MOTOR (DETECTANDO SI ES SQLITE O POSTGRES)
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # Configuración específica para SQLite (local)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Configuración para PostgreSQL (nube)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()