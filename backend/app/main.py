from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import StreamingResponse
from datetime import date
from sqlalchemy import text

import json
import pypdf
from io import BytesIO

# --- IMPORTS ---
from app.database import engine, Base, get_db
from app.modules.crm import models, schemas
from app.modules.auth import utils
# Asegúrate de tener estos archivos en sus carpetas (crm o erp)
from app.modules.crm.pdf_generator import generar_pdf_factura
from app.modules.crm.sepa_generator import generar_xml_sepa 
from app.gemini_service import ask_gemini 

# Crear tablas (Esto actualizará la DB cuando reinicies)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Modular Loviluz - Energy Suite")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESQUEMAS AUTH & CHAT ---
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class ClaudeRequest(BaseModel):
    prompt: str
    
class UserRoleUpdate(BaseModel):
    role: str

# ==========================================
# 🔐 ZONA AUTH & GOBERNANZA
# ==========================================

@app.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user: raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_pwd = utils.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    
    token = utils.create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "role": new_user.role, "email": new_user.email}

@app.post("/login", response_model=Token)
def login_for_access_token(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    token = utils.create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer", "role": db_user.role, "email": db_user.email}

@app.get("/users/")
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/users/{user_id}/role")
def cambiar_rol_usuario(user_id: int, update: UserRoleUpdate, db: Session = Depends(get_db)):
    usuario = db.query(models.User).filter(models.User.id == user_id).first()
    if not usuario: raise HTTPException(404, "Usuario no encontrado")
    usuario.role = update.role
    db.commit()
    return {"msg": f"Rol actualizado a {update.role}"}

# ==========================================
# 👥 ZONA CRM (Clientes & CUPS)
# ==========================================

@app.get("/")
def read_root():
    return {"estado": "Sistema Energy Online ⚡", "IA": "Gemini Activa"}

# --- CLIENTES ---
@app.post("/clientes/", response_model=schemas.ClienteResponse)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.nif_cif == cliente.nif_cif).first()
    if db_cliente: raise HTTPException(400, "Este NIF/CIF ya existe")
    
    nuevo = models.Cliente(**cliente.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.get("/clientes/", response_model=list[schemas.ClienteResponse])
def leer_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).all()

@app.put("/clientes/{cliente_id}")
def actualizar_cliente(cliente_id: int, datos: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    for key, value in datos.dict().items():
        setattr(cliente, key, value)
    
    db.commit()
    return {"msg": "Cliente actualizado"}

# --- PUNTOS DE SUMINISTRO (CUPS) ---
@app.post("/puntos-suministro/", response_model=schemas.PuntoSuministroResponse)
def crear_cups(cups: schemas.PuntoSuministroCreate, db: Session = Depends(get_db)):
    existe = db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cups == cups.cups).first()
    if existe: raise HTTPException(400, "Este CUPS ya está registrado")
    
    nuevo_cups = models.PuntoSuministro(**cups.dict())
    db.add(nuevo_cups)
    db.commit()
    db.refresh(nuevo_cups)
    return nuevo_cups

@app.get("/puntos-suministro/{cliente_id}", response_model=list[schemas.PuntoSuministroResponse])
def leer_cups_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cliente_id == cliente_id).all()

# ==========================================
# ⚡ ZONA CONTRATOS
# ==========================================

@app.post("/contratos/", response_model=schemas.ContratoResponse)
def crear_contrato(contrato: schemas.ContratoCreate, db: Session = Depends(get_db)):
    # Validar que el CUPS exista
    cups = db.query(models.PuntoSuministro).filter(models.PuntoSuministro.id == contrato.punto_suministro_id).first()
    if not cups: raise HTTPException(404, "Punto de Suministro no encontrado")
    
    nuevo_contrato = models.Contrato(**contrato.dict())
    db.add(nuevo_contrato)
    db.commit()
    db.refresh(nuevo_contrato)
    return nuevo_contrato

@app.get("/contratos/{cliente_id}", response_model=list[schemas.ContratoResponse])
def leer_contratos_cliente(cliente_id: int, db: Session = Depends(get_db)):
    # Buscamos contratos a través de los CUPS del cliente
    # (Consulta un poco más compleja al tener relación indirecta Cliente -> CUPS -> Contrato)
    # Para simplificar, podemos filtrar por los CUPS del cliente
    cups_ids = [c.id for c in db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cliente_id == cliente_id).all()]
    return db.query(models.Contrato).filter(models.Contrato.punto_suministro_id.in_(cups_ids)).all()

# ==========================================
# 💶 ZONA FACTURACIÓN
# ==========================================

@app.post("/facturas/", response_model=schemas.FacturaResponse)
def crear_factura(factura: schemas.FacturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == factura.cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    nueva = models.Factura(**factura.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.get("/facturas/", response_model=list[schemas.FacturaResponse])
def leer_facturas(db: Session = Depends(get_db)):
    return db.query(models.Factura).all()

@app.get("/facturas/{factura_id}/pdf")
def descargar_factura_pdf(factura_id: int, db: Session = Depends(get_db)):
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura: raise HTTPException(404, "Factura no encontrada")
    
    # OJO: factura.cliente funciona porque está definido en el modelo Factura
    pdf_buffer = generar_pdf_factura(factura, factura.cliente)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Factura_{factura.id}.pdf"}
    )

@app.post("/facturas/generar-remesa")
def generar_remesa_sepa(factura_ids: List[int], db: Session = Depends(get_db)):
    facturas = db.query(models.Factura).filter(models.Factura.id.in_(factura_ids)).all()
    if not facturas: raise HTTPException(400, "Sin facturas")
    
    mi_empresa = {
        "nombre": "LOVILUZ ENERGIA S.L.",
        "iban": "ES4521000418450200051332", 
        "bic": "CAIXESBBXXX",
        "creditor_id": "ES02000G12345678"
    }
    
    # Usamos el generador seguro que hicimos antes
    xml_buffer = generar_xml_sepa(facturas, mi_empresa)
    return StreamingResponse(xml_buffer, media_type="application/xml", headers={"Content-Disposition": f"attachment; filename=Remesa_{date.today()}.xml"})

# ==========================================
# 🧠 ZONA IA & DASHBOARD
# ==========================================

@app.get("/dashboard-stats/")
def obtener_estadisticas(db: Session = Depends(get_db)):
    total_clientes = db.query(models.Cliente).count()
    total_facturas = db.query(models.Factura).count()
    total_dinero = sum(f.monto for f in db.query(models.Factura).all())
    
    # Calcular activos (clientes con al menos un contrato activo)
    # Simplificado: Clientes marcados como is_active
    activos = db.query(models.Cliente).filter(models.Cliente.is_active == True).count()
    
    return {
        "total_clientes": total_clientes,
        "total_facturas": total_facturas,
        "total_dinero": total_dinero,
        "activos": activos,
        "inactivos": total_clientes - activos,
        "nuevos_hoy": 0 # Podríamos filtrarlo por fecha
    }

@app.post("/energia/analizar-factura")
async def analizar_factura(factura: UploadFile = File(...)):
    # Lógica de lectura PDF + Gemini
    try:
        content = await factura.read()
        pdf_file = BytesIO(content)
        reader = pypdf.PdfReader(pdf_file)
        texto = ""
        for i in range(min(2, len(reader.pages))): texto += reader.pages[i].extract_text()
        
        prompt = f"Extrae JSON {{'consumo': float, 'potencia': float}} de: {texto[:3000]}"
        res_ia = ask_gemini(prompt)
        
        # Limpieza simple (puedes mejorarla con regex si falla mucho)
        if "{" in res_ia:
            res_ia = res_ia[res_ia.find("{"):res_ia.rfind("}")+1]
        
        datos = json.loads(res_ia)
        
        # Ofertas simuladas
        ofertas = [
            {"nombre": "Plan Estable", "compania": "Loviluz", "ahorro": "120€"},
            {"nombre": "Indexada Pro", "compania": "Mercado", "ahorro": "80€"}
        ]
        
        return {
            "consumo": datos.get("consumo", 0),
            "potencia": datos.get("potencia", 0),
            "ofertas": ofertas
        }
    except Exception as e:
        print(e)
        return {"consumo": 0, "potencia": 0, "ofertas": []}

@app.post("/ia/consultar")
async def consultar_base_datos(req: ClaudeRequest, db: Session = Depends(get_db)):
    # Lógica Text-to-SQL con Gemini
    try:
        # 1. Generar SQL
        schema_info = "Tablas: clientes, contratos, facturas, puntos_suministro"
        prompt_sql = f"Genera solo SQL (SQLite) para: {req.prompt}. Schema: {schema_info}"
        sql = ask_gemini(prompt_sql).replace("```sql", "").replace("```", "").strip()
        
        if "DELETE" in sql.upper() or "DROP" in sql.upper(): return {"reply": "No puedo borrar datos."}
        
        # 2. Ejecutar
        res = db.execute(text(sql)).fetchall()
        
        # 3. Explicar
        prompt_final = f"Pregunta: {req.prompt}. Datos: {str(res)}. Responde natural."
        reply = ask_gemini(prompt_final)
        
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"No pude obtener esa información. ({str(e)})"}