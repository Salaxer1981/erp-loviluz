from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship # <--- Para conectar tablas
from app.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    empresa = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    telefono = Column(String, nullable=True)
    
    # --- CAMPO NUEVO ---
    iban = Column(String, nullable=True) # Para las remesas SEPA
    # -------------------

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    facturas = relationship("Factura", back_populates="cliente")

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float)
    concepto = Column(String)
    estado = Column(String, default="Pendiente") # Pendiente, Pagada, Vencida
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Clave Foránea: Aquí guardamos el ID del cliente dueño de la factura
    cliente_id = Column(Integer, ForeignKey("clientes.id"))

    # Relación inversa: Una factura pertenece a un cliente
    cliente = relationship("Cliente", back_populates="facturas")

    # ... (imports anteriores)

# AÑADIR ESTO AL FINAL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) # ¡Aquí guardamos la contraseña encriptada!
    is_active = Column(Boolean, default=True)