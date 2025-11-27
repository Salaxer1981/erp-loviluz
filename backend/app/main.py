from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# Imports de tus módulos
from app.database import engine, Base, get_db
from app.modules.crm import models, schemas
from app.modules.auth import utils

from fastapi.responses import StreamingResponse # Para enviar archivos
from app.modules.crm.pdf_generator import generar_pdf_factura
from fastapi import UploadFile, File 
from app.modules.crm.sepa_generator import generar_xml_sepa

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Modular Audinfor Clone")

# Configuración de CORS (Permitir que React se conecte)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESQUEMAS PARA AUTENTICACIÓN ---
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ==========================================
# 🔐 ZONA DE SEGURIDAD (Auth)
# ==========================================

@app.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_pwd = utils.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    
    access_token = utils.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login_for_access_token(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")
    
    if not utils.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")
    
    access_token = utils.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# 👥 ZONA CRM (Clientes)
# ==========================================

@app.get("/")
def read_root():
    return {"estado": "Sistema Online 🚀", "db": "Conectada"}

@app.post("/clientes/", response_model=schemas.ClienteResponse)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    # Verificar duplicados
    db_cliente = db.query(models.Cliente).filter(models.Cliente.email == cliente.email).first()
    if db_cliente:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    nuevo_cliente = models.Cliente(
        nombre=cliente.nombre,
        empresa=cliente.empresa,
        email=cliente.email,
        telefono=cliente.telefono
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

@app.get("/clientes/", response_model=list[schemas.ClienteResponse])
def leer_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Cliente).offset(skip).limit(limit).all()

# ==========================================
# 💶 ZONA FACTURACIÓN
# ==========================================

@app.post("/facturas/", response_model=schemas.FacturaResponse)
def crear_factura(factura: schemas.FacturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == factura.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    nueva_factura = models.Factura(
        monto=factura.monto,
        concepto=factura.concepto,
        cliente_id=factura.cliente_id
    )
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    return nueva_factura

@app.get("/facturas/", response_model=list[schemas.FacturaResponse])
def leer_facturas(db: Session = Depends(get_db)):
    return db.query(models.Factura).all()

@app.get("/facturas/{factura_id}/pdf")
def descargar_factura_pdf(factura_id: int, db: Session = Depends(get_db)):
    # 1. Buscar la factura en la base de datos
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    # 2. Obtener el cliente asociado
    cliente = factura.cliente 

    # 3. Generar el PDF en memoria
    pdf_buffer = generar_pdf_factura(factura, cliente)

    # 4. Enviarlo al navegador como descarga
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Factura_{factura.id}.pdf"}
    )
@app.post("/facturas/generar-remesa")
def generar_remesa_sepa(factura_ids: List[int], db: Session = Depends(get_db)):
    # 1. Buscar las facturas seleccionadas
    facturas = db.query(models.Factura).filter(models.Factura.id.in_(factura_ids)).all()
    
    if not facturas:
        raise HTTPException(status_code=400, detail="No se han seleccionado facturas")

    # 2. Datos de TU empresa (Esto vendría de configuración, hardcodeado por ahora)
    mi_empresa = {
        "nombre": "LOVILUZ ENERGIA S.L.",
        "iban": "ES9100000000000000000000", # IBAN Ficticio
        "bic": "FAKEBICXXX",
        "creditor_id": "ES0200000000"
    }

    # 3. Generar XML
    try:
        xml_buffer = generar_xml_sepa(facturas, mi_empresa)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error generando SEPA: {str(e)}")

    # 4. Descargar
    return StreamingResponse(
        xml_buffer,
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename=Remesa_{date.today()}.xml"}
    )

# ==========================================
# 📊 ZONA DASHBOARD
# ==========================================

@app.get("/dashboard-stats/")
def obtener_estadisticas(db: Session = Depends(get_db)):
    # 1. Totales Generales
    total_clientes = db.query(models.Cliente).count()
    total_facturas = db.query(models.Factura).count()
    
    # 2. Dinero Total
    facturas = db.query(models.Factura).all()
    total_dinero = sum(f.monto for f in facturas)
    
    # 3. Contratos (Clientes) Activos vs Inactivos
    clientes_activos = db.query(models.Cliente).filter(models.Cliente.is_active == True).count()
    clientes_inactivos = total_clientes - clientes_activos

    # 4. Altas de HOY (Comparando fechas)
    # Nota: En una DB real usaríamos filtros de SQL, aquí hacemos un filtro simple en Python
    hoy = date.today()
    # Filtramos clientes creados hoy (convertimos created_at a fecha simple)
    all_clients = db.query(models.Cliente).all()
    nuevos_hoy = sum(1 for c in all_clients if c.created_at.date() == hoy)

    return {
        "total_clientes": total_clientes,
        "activos": clientes_activos,
        "inactivos": clientes_inactivos,
        "nuevos_hoy": nuevos_hoy,
        "total_facturas": total_facturas,
        "total_dinero": total_dinero
    }


# ==========================================
# 🤖 ZONA IA (Integración Azure/Dynamics)
# ==========================================

@app.post("/energia/analizar-factura")
async def analizar_factura(factura: UploadFile = File(...)):
    # 1. AQUÍ ES DONDE LLAMAREMOS A TU AZURE REAL MÁS ADELANTE
    # contents = await factura.read()
    # response = requests.post("TU_URL_DE_AZURE", files=...)
    
    # 2. Simulación de respuesta (para probar el diseño)
    import time
    time.sleep(2) # Simulamos que la IA está pensando
    
    return {
        "consumo": 345.50,
        "potencia": 4.6,
        "ofertas": [
            {"nombre": "Plan Online", "compania": "Iberdrola", "ahorro": "120€ / año"},
            {"nombre": "Tarifa One", "compania": "Endesa", "ahorro": "85€ / año"},
        ]
    }