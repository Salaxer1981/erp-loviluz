from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# =======================
# 1. ESQUEMAS DE CLIENTE
# =======================
class ClienteBase(BaseModel):
    nombre: str
    nif_cif: str # DNI o CIF (Obligatorio)
    persona_contacto: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    iban: Optional[str] = None
    tipo_cliente: str = "PYME" # Hogar, PYME, Gran Cuenta

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# =======================
# 2. ESQUEMAS DE PUNTOS DE SUMINISTRO (CUPS)
# =======================
class PuntoSuministroBase(BaseModel):
    cups: str
    direccion: str
    codigo_postal: str
    provincia: str
    tarifa_acceso: str # Ej: 2.0TD
    distribuidora: Optional[str] = None
    cliente_id: int # Vinculado al cliente

class PuntoSuministroCreate(PuntoSuministroBase):
    pass

class PuntoSuministroResponse(PuntoSuministroBase):
    id: int
    class Config:
        from_attributes = True

# =======================
# 3. ESQUEMAS DE CONTRATO (Energía)
# =======================
class ContratoBase(BaseModel):
    punto_suministro_id: int
    
    # Datos Comerciales
    comercializadora: str
    producto: str # Nombre del plan
    
    # Fechas Clave (Para alertas de renovación)
    fecha_firma: Optional[date] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None 
    
    # Potencias Contratadas (kW) - Importante para optimización
    p1: float = 0.0
    p2: float = 0.0
    p3: float = 0.0
    p4: float = 0.0
    p5: float = 0.0
    p6: float = 0.0
    
    estado: str = "Borrador"

class ContratoCreate(ContratoBase):
    pass

class ContratoUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_fin: Optional[date] = None

class ContratoResponse(ContratoBase):
    id: int
    class Config:
        from_attributes = True

# =======================
# 4. ESQUEMAS DE FACTURA
# =======================
class FacturaBase(BaseModel):
    monto: float
    concepto: str
    cliente_id: int

class FacturaCreate(FacturaBase):
    pass

class FacturaResponse(FacturaBase):
    id: int
    estado: str
    created_at: datetime
    class Config:
        from_attributes = True

# =======================
# 5. ESQUEMAS DE TARIFAS (Comparador)
# =======================
class TarifaBase(BaseModel):
    nombre: str
    compania: str
    precio_potencia: float
    precio_energia: float
    tipo: str

class TarifaCreate(TarifaBase):
    pass

class TarifaResponse(TarifaBase):
    id: int
    class Config:
        from_attributes = True