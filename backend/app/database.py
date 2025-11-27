from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. La URL de la base de datos (Ahora usamos SQLite local)
# Si fuera Postgres sería: "postgresql://usuario:pass@localhost/db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./crm_database.db"

# 2. Creamos el motor (El "cerebro" de la DB)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Creamos la sesión (Para poder guardar/leer datos)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. La clase base para nuestros modelos (Tablas)
Base = declarative_base()

# 5. Dependencia para obtener la DB en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()