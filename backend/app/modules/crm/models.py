from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# 1. USUARIOS
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="comercial")

# 2. CLIENTES
class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    nif_cif = Column(String, unique=True, index=True)
    persona_contacto = Column(String, nullable=True)
    email = Column(String, index=True)
    telefono = Column(String, nullable=True)
    iban = Column(String, nullable=True)
    tipo_cliente = Column(String, default="PYME")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    puntos_suministro = relationship("PuntoSuministro", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")
    documentos = relationship("Documento", back_populates="cliente")
    tickets = relationship("Ticket", back_populates="cliente")

# 3. PUNTO DE SUMINISTRO
class PuntoSuministro(Base):
    __tablename__ = "puntos_suministro"
    id = Column(Integer, primary_key=True, index=True)
    cups = Column(String(22), unique=True, index=True)
    direccion = Column(String)
    codigo_postal = Column(String)
    provincia = Column(String)
    tarifa_acceso = Column(String)
    distribuidora = Column(String, nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="puntos_suministro")
    contratos = relationship("Contrato", back_populates="punto_suministro")

# 4. CONTRATO
class Contrato(Base):
    __tablename__ = "contratos"
    id = Column(Integer, primary_key=True, index=True)
    fecha_firma = Column(Date, nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    comercializadora = Column(String)
    producto = Column(String)
    p1 = Column(Float, default=0.0)
    p2 = Column(Float, default=0.0)
    p3 = Column(Float, default=0.0)
    p4 = Column(Float, default=0.0)
    p5 = Column(Float, default=0.0)
    p6 = Column(Float, default=0.0)
    estado = Column(String, default="Borrador")
    punto_suministro_id = Column(Integer, ForeignKey("puntos_suministro.id"))
    punto_suministro = relationship("PuntoSuministro", back_populates="contratos")
    
    atr = relationship("ProcesoATR", back_populates="contrato", uselist=False) # 1 a 1

# 5. NUEVO: PROCESO ATR (Switching)
class ProcesoATR(Base):
    __tablename__ = "procesos_atr"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, default="C1") # C1: Alta, C2: Cambio Titular
    codigo_solicitud = Column(String) # ID enviado a distribuidora
    estado_atr = Column(String, default="01-Solicitado") # 01, 02-Aceptado, 03-Rechazado
    motivo_rechazo = Column(String, nullable=True)
    fecha_solicitud = Column(DateTime(timezone=True), server_default=func.now())
    
    contrato_id = Column(Integer, ForeignKey("contratos.id"))
    contrato = relationship("Contrato", back_populates="atr")

# 6. NUEVO: DOCUMENTOS
class Documento(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String) # DNI, FACTURA, CIE
    nombre_archivo = Column(String)
    url_archivo = Column(String) # Ruta local o URL nube
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="documentos")

# 7. FACTURAS & TARIFAS (Sin cambios)
class Factura(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float)
    concepto = Column(String)
    estado = Column(String, default="Pendiente") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="facturas")

class Tarifa(Base):
    __tablename__ = "tarifas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    compania = Column(String, index=True)
    precio_potencia = Column(Float)
    precio_energia = Column(Float)
    tipo = Column(String)
    is_active = Column(Boolean, default=True)

# 8. SOPORTE (Tickets)
class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    asunto = Column(String)
    descripcion = Column(String)
    prioridad = Column(String, default="Media") # Baja, Media, Alta, Urgente
    estado = Column(String, default="Abierto") # Abierto, En Proceso, Resuelto
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    cliente = relationship("Cliente", back_populates="tickets")
    
    mensajes = relationship("MensajeTicket", back_populates="ticket")

class MensajeTicket(Base):
    __tablename__ = "mensajes_ticket"

    id = Column(Integer, primary_key=True, index=True)
    texto = Column(String)
    es_interno = Column(Boolean, default=False) # True = Nota interna (no la ve el cliente)
    autor = Column(String, default="Agente") # Nombre del que escribe
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    ticket = relationship("Ticket", back_populates="mensajes")
