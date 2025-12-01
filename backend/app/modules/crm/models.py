from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# 1. USUARIOS (Para el Login y Gobernanza)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="comercial") # admin, comercial, contabilidad

# 2. CLIENTES (Titular del contrato)
class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    
    # Datos Fiscales y de Contacto
    nombre = Column(String, index=True) # Nombre comercial o Razón Social
    nif_cif = Column(String, unique=True, index=True) # DNI/CIF (Vital para el sector)
    persona_contacto = Column(String, nullable=True)
    
    email = Column(String, index=True)
    telefono = Column(String, nullable=True)
    
    # Datos Bancarios
    iban = Column(String, nullable=True)
    
    # Metadatos
    tipo_cliente = Column(String, default="PYME") # Residencial, PYME, Gran Cuenta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relaciones
    puntos_suministro = relationship("PuntoSuministro", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")

# 3. PUNTO DE SUMINISTRO (El lugar físico - CUPS)
class PuntoSuministro(Base):
    __tablename__ = "puntos_suministro"

    id = Column(Integer, primary_key=True, index=True)
    cups = Column(String(22), unique=True, index=True) # El DNI de la luz
    direccion = Column(String)
    codigo_postal = Column(String)
    provincia = Column(String)
    tarifa_acceso = Column(String) # Ej: 2.0TD, 3.0TD, 6.1TD
    distribuidora = Column(String, nullable=True) # Ej: I-DE, UFD

    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="puntos_suministro")
    
    # Un punto puede tener un historial de contratos
    contratos = relationship("Contrato", back_populates="punto_suministro")

# 4. CONTRATO (Las condiciones económicas vigentes)
class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Fechas Críticas para Renovación
    fecha_firma = Column(Date, nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True) # ¡Importante para alertas!
    
    comercializadora = Column(String) # Ej: Iberdrola, Endesa
    producto = Column(String) # Ej: "Plan Estable", "Precio Indexado"
    
    # Potencias Contratadas (kW)
    p1 = Column(Float, default=0.0)
    p2 = Column(Float, default=0.0)
    p3 = Column(Float, default=0.0)
    p4 = Column(Float, default=0.0)
    p5 = Column(Float, default=0.0)
    p6 = Column(Float, default=0.0)
    
    estado = Column(String, default="Borrador") # Borrador, Activo, Bajas, Renovación
    
    punto_suministro_id = Column(Integer, ForeignKey("puntos_suministro.id"))
    punto_suministro = relationship("PuntoSuministro", back_populates="contratos")

# 5. FACTURAS (Módulo de Cobros)
class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float)
    concepto = Column(String)
    estado = Column(String, default="Pendiente") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="facturas")

# 6. TARIFAS (Para el Comparador)
class Tarifa(Base):
    __tablename__ = "tarifas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    compania = Column(String, index=True)
    precio_potencia = Column(Float)
    precio_energia = Column(Float)
    tipo = Column(String)
    is_active = Column(Boolean, default=True)