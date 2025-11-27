from pydantic import BaseModel
from typing import Optional  # <--- 1. Importamos esto

# Esquema para recibir datos (Crear Cliente)
class ClienteCreate(BaseModel):
    nombre: str
    empresa: str
    email: str
    telefono: Optional[str] = None
    iban: Optional[str] = None # <--- AÑADIR ESTO

# Esquema para devolver datos (Leer Cliente)
class ClienteResponse(ClienteCreate):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# ... (lo anterior déjalo igual)

class FacturaCreate(BaseModel):
    monto: float
    concepto: str
    cliente_id: int

class FacturaResponse(FacturaCreate):
    id: int
    estado: str
    class Config:
        from_attributes = True