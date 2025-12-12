from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import StreamingResponse
from datetime import date, timedelta
from sqlalchemy import text

import os
import time
import json
import pypdf
from io import BytesIO

# Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- IMPORTS ---
from app.database import engine, Base, get_db
from app.modules.crm import models, schemas
from app.modules.auth import utils
from app.modules.auth.utils import get_current_active_user, get_admin_user
# Asegúrate de tener estos archivos en sus carpetas (crm o erp)
from app.modules.crm.pdf_generator import generar_pdf_factura
from app.modules.crm.sepa_generator import generar_xml_sepa 
from app.gemini_service import ask_gemini 
from datetime import date, timedelta 

# Crear tablas (Esto actualizará la DB cuando reinicies)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Modular Loviluz - Energy Suite")

# --- 1. LOGS DE AUDITORÍA (Middleware) ---
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Procesar la petición
    response = await call_next(request)
    
    # Calcular tiempo y registrar
    process_time = time.time() - start_time
    log_message = f"AUDIT: {request.method} {request.url.path} - Status: {response.status_code} - Tiempo: {process_time:.4f}s"
    print(log_message)  # Esto saldrá en tu terminal (o logs de Render)
    
    return response

# Configurar Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- 2. SEGURIDAD CORS (Dominios Permitidos) ---
origins = [
    "http://localhost:5173",              # Tu entorno local
    "http://localhost:5174",              # Frontend alternativo local
    "https://erp-loviluz.onrender.com",   # Tu futuro dominio backend
    "https://erp-loviluz.vercel.app",     # Tu futuro dominio frontend
    os.getenv("FRONTEND_URL", "")         # Variable opcional para flexibilidad
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
@limiter.limit("3/hour")  # Máximo 3 registros por hora por IP
def register_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user: raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_pwd = utils.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    
    token = utils.create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "role": new_user.role, "email": new_user.email}

@app.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Máximo 5 intentos de login por minuto por IP
def login_for_access_token(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    token = utils.create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer", "role": db_user.role, "email": db_user.email}

@app.get("/users/")
def listar_usuarios(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_admin_user)
):
    return db.query(models.User).all()

@app.put("/users/{user_id}/role")
@limiter.limit("10/minute")  # Máximo 10 cambios de rol por minuto
def cambiar_rol_usuario(
    request: Request,
    user_id: int, 
    update: UserRoleUpdate, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_admin_user)
):
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
def crear_cliente(
    cliente: schemas.ClienteCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.nif_cif == cliente.nif_cif).first()
    if db_cliente: raise HTTPException(400, "Este NIF/CIF ya existe")
    
    nuevo = models.Cliente(**cliente.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.get("/clientes/", response_model=list[schemas.ClienteResponse])
def leer_clientes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return db.query(models.Cliente).all()

@app.put("/clientes/{cliente_id}")
def actualizar_cliente(
    cliente_id: int, 
    datos: schemas.ClienteCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    for key, value in datos.dict().items():
        setattr(cliente, key, value)
    
    db.commit()
    return {"msg": "Cliente actualizado"}

# --- PUNTOS DE SUMINISTRO (CUPS) ---
@app.post("/puntos-suministro/", response_model=schemas.PuntoSuministroResponse)
def crear_cups(
    cups: schemas.PuntoSuministroCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    existe = db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cups == cups.cups).first()
    if existe: raise HTTPException(400, "Este CUPS ya está registrado")
    
    nuevo_cups = models.PuntoSuministro(**cups.dict())
    db.add(nuevo_cups)
    db.commit()
    db.refresh(nuevo_cups)
    return nuevo_cups

@app.get("/puntos-suministro/{cliente_id}", response_model=list[schemas.PuntoSuministroResponse])
def leer_cups_cliente(
    cliente_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cliente_id == cliente_id).all()

# ==========================================
# ⚡ ZONA CONTRATOS
# ==========================================

@app.post("/contratos/", response_model=schemas.ContratoResponse)
def crear_contrato(
    contrato: schemas.ContratoCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Validar que el CUPS exista
    cups = db.query(models.PuntoSuministro).filter(models.PuntoSuministro.id == contrato.punto_suministro_id).first()
    if not cups: raise HTTPException(404, "Punto de Suministro no encontrado")
    
    nuevo_contrato = models.Contrato(**contrato.dict())
    db.add(nuevo_contrato)
    db.commit()
    db.refresh(nuevo_contrato)
    return nuevo_contrato

@app.get("/contratos/{cliente_id}", response_model=list[schemas.ContratoResponse])
def leer_contratos_cliente(
    cliente_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Buscamos contratos a través de los CUPS del cliente
    # (Consulta un poco más compleja al tener relación indirecta Cliente -> CUPS -> Contrato)
    # Para simplificar, podemos filtrar por los CUPS del cliente
    cups_ids = [c.id for c in db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cliente_id == cliente_id).all()]
    return db.query(models.Contrato).filter(models.Contrato.punto_suministro_id.in_(cups_ids)).all()

# ==========================================
# 💶 ZONA FACTURACIÓN
# ==========================================

@app.post("/facturas/", response_model=schemas.FacturaResponse)
def crear_factura(
    factura: schemas.FacturaCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == factura.cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    nueva = models.Factura(**factura.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.get("/facturas/", response_model=list[schemas.FacturaResponse])
def leer_facturas(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return db.query(models.Factura).all()

@app.get("/facturas/{factura_id}/pdf")
def descargar_factura_pdf(
    factura_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
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
def generar_remesa_sepa(
    factura_ids: List[int], 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
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
def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    total_clientes = db.query(models.Cliente).count()
    total_facturas = db.query(models.Factura).count()
    total_dinero = sum(f.monto for f in db.query(models.Factura).all())
    
    # Calcular activos (clientes con al menos un contrato activo)
    # Simplificado: Clientes marcados como is_active
    activos = db.query(models.Cliente).filter(models.Cliente.is_active == True).count()
    
    # Lógica de Renovaciones (Próximos 45 días)
    hoy = date.today()
    limite = hoy + timedelta(days=45)
    
    # Contamos contratos activos que vencen pronto
    por_vencer = db.query(models.Contrato).filter(
        models.Contrato.estado == "Activo",
        models.Contrato.fecha_fin >= hoy,
        models.Contrato.fecha_fin <= limite
    ).count()
    
    return {
        "total_clientes": total_clientes,
        "total_facturas": total_facturas,
        "total_dinero": total_dinero,
        "activos": activos,
        "inactivos": total_clientes - activos,
        "nuevos_hoy": 0,
        "por_vencer": por_vencer  # DATO NUEVO CLAVE para alertas
    }

@app.get("/renovaciones/pendientes")
def leer_renovaciones_pendientes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Devuelve la lista detallada de contratos que vencen pronto"""
    hoy = date.today()
    limite = hoy + timedelta(days=45)  # Ventana de 45 días
    
    contratos = db.query(models.Contrato).filter(
        models.Contrato.estado == "Activo",
        models.Contrato.fecha_fin >= hoy,
        models.Contrato.fecha_fin <= limite
    ).order_by(models.Contrato.fecha_fin).all()  # Ordenados por urgencia
    
    # Enriquecemos la respuesta con datos del cliente para la tabla
    resultado = []
    for c in contratos:
        dias_restantes = (c.fecha_fin - hoy).days
        
        # Obtener datos del cliente a través del punto de suministro
        punto = db.query(models.PuntoSuministro).filter(
            models.PuntoSuministro.id == c.punto_suministro_id
        ).first()
        
        if punto and punto.cliente:
            resultado.append({
                "id": c.id,
                "cliente": punto.cliente.nombre,
                "telefono": punto.cliente.telefono or "N/A",
                "cups": punto.cups,
                "comercializadora": c.comercializadora,
                "fecha_fin": c.fecha_fin.isoformat() if c.fecha_fin else None,
                "dias_restantes": dias_restantes
            })
    
    return resultado

# ==========================================
# 🆘 ZONA SOPORTE & TICKETS
# ==========================================

@app.post("/tickets/", response_model=schemas.TicketResponse)
def crear_ticket(
    ticket: schemas.TicketCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    nuevo = models.Ticket(**ticket.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.get("/tickets/", response_model=List[schemas.TicketResponse])
def listar_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return db.query(models.Ticket).order_by(models.Ticket.fecha_creacion.desc()).all()

@app.post("/tickets/mensaje", response_model=schemas.MensajeResponse)
def enviar_mensaje_ticket(
    mensaje: schemas.MensajeCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    nuevo = models.MensajeTicket(**mensaje.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.get("/tickets/{ticket_id}/mensajes", response_model=List[schemas.MensajeResponse])
def leer_mensajes_ticket(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return db.query(models.MensajeTicket).filter(models.MensajeTicket.ticket_id == ticket_id).order_by(models.MensajeTicket.fecha).all()

@app.put("/tickets/{ticket_id}/estado")
def cambiar_estado_ticket(
    ticket_id: int, 
    estado: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket: raise HTTPException(404, "Ticket no encontrado")
    ticket.estado = estado
    db.commit()
    return {"msg": "Estado actualizado"}

@app.post("/energia/analizar-factura")
@limiter.limit("20/hour")  # Máximo 20 análisis de facturas por hora
async def analizar_factura(request: Request, factura: UploadFile = File(...)):
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
@limiter.limit("10/minute")  # Limitar consultas a IA
async def consultar_base_datos(request: Request, req: ClaudeRequest, db: Session = Depends(get_db)):
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

# ==========================================
# 📤 ZONA UPLOAD DE ARCHIVOS
# ==========================================

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Subir archivo y guardar en el servidor"""
    import os
    from pathlib import Path
    
    # Crear directorio uploads si no existe
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Generar nombre único para el archivo
    import time
    timestamp = int(time.time())
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = upload_dir / unique_filename
    
    # Guardar archivo
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"url": str(file_path), "filename": unique_filename}

# ==========================================
# 📄 ZONA DOCUMENTOS
# ==========================================

@app.post("/documentos/", response_model=schemas.DocumentoResponse)
def crear_documento(
    documento: schemas.DocumentoCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Crear un nuevo documento asociado a un cliente"""
    cliente = db.query(models.Cliente).filter(models.Cliente.id == documento.cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    nuevo_doc = models.Documento(**documento.dict())
    db.add(nuevo_doc)
    db.commit()
    db.refresh(nuevo_doc)
    return nuevo_doc

@app.get("/documentos/cliente/{cliente_id}", response_model=list[schemas.DocumentoResponse])
def listar_documentos_cliente(
    cliente_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Obtener todos los documentos de un cliente"""
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    
    return db.query(models.Documento).filter(models.Documento.cliente_id == cliente_id).all()

@app.get("/documentos/{documento_id}", response_model=schemas.DocumentoResponse)
def obtener_documento(
    documento_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Obtener un documento específico"""
    documento = db.query(models.Documento).filter(models.Documento.id == documento_id).first()
    if not documento: raise HTTPException(404, "Documento no encontrado")
    return documento

@app.delete("/documentos/{documento_id}")
def eliminar_documento(
    documento_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Eliminar un documento"""
    documento = db.query(models.Documento).filter(models.Documento.id == documento_id).first()
    if not documento: raise HTTPException(404, "Documento no encontrado")
    
    db.delete(documento)
    db.commit()
    return {"msg": "Documento eliminado correctamente"}

# ==========================================
# 🔄 ZONA PROCESO ATR (Switching)
# ==========================================

@app.post("/procesos-atr/", response_model=schemas.ProcesoATRResponse)
def crear_proceso_atr(
    proceso: schemas.ProcesoATRCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Iniciar un nuevo proceso ATR para un contrato"""
    contrato = db.query(models.Contrato).filter(models.Contrato.id == proceso.contrato_id).first()
    if not contrato: raise HTTPException(404, "Contrato no encontrado")
    
    # Verificar que no exista ya un proceso ATR para este contrato
    proceso_existente = db.query(models.ProcesoATR).filter(models.ProcesoATR.contrato_id == proceso.contrato_id).first()
    if proceso_existente: 
        raise HTTPException(400, "Ya existe un proceso ATR para este contrato")
    
    nuevo_proceso = models.ProcesoATR(**proceso.dict())
    db.add(nuevo_proceso)
    db.commit()
    db.refresh(nuevo_proceso)
    return nuevo_proceso

@app.get("/procesos-atr/")
def listar_procesos_atr(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Endpoint optimizado para listar procesos ATR con datos cruzados"""
    # Traemos todos los procesos ATR ordenados por fecha (los más nuevos primero)
    procesos = db.query(models.ProcesoATR).order_by(models.ProcesoATR.fecha_solicitud.desc()).all()
    
    # Preparamos una lista limpia con datos cruzados (Nombre Cliente, CUPS, etc.)
    resultado = []
    for p in procesos:
        # Navegamos por las relaciones: Proceso -> Contrato -> Cliente / Punto
        nombre_cliente = "Desconocido"
        cups_cliente = "N/A"
        
        if p.contrato:
            if p.contrato.cliente:
                nombre_cliente = p.contrato.cliente.nombre
            if p.contrato.punto_suministro:
                cups_cliente = p.contrato.punto_suministro.cups

        resultado.append({
            "id": p.id,
            "codigo": p.codigo_solicitud,
            "tipo": p.tipo,  # C1 = Alta, C2 = Cambio
            "estado": p.estado_atr,
            "fecha": p.fecha_solicitud,
            "cliente": nombre_cliente,
            "cups": cups_cliente
        })
    
    return resultado

@app.get("/procesos-atr/{proceso_id}", response_model=schemas.ProcesoATRResponse)
def obtener_proceso_atr(
    proceso_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Obtener un proceso ATR específico"""
    proceso = db.query(models.ProcesoATR).filter(models.ProcesoATR.id == proceso_id).first()
    if not proceso: raise HTTPException(404, "Proceso ATR no encontrado")
    return proceso

@app.get("/procesos-atr/contrato/{contrato_id}", response_model=schemas.ProcesoATRResponse)
def obtener_proceso_atr_por_contrato(
    contrato_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Obtener el proceso ATR de un contrato específico"""
    proceso = db.query(models.ProcesoATR).filter(models.ProcesoATR.contrato_id == contrato_id).first()
    if not proceso: raise HTTPException(404, "No hay proceso ATR para este contrato")
    return proceso

@app.put("/procesos-atr/{proceso_id}", response_model=schemas.ProcesoATRResponse)
def actualizar_proceso_atr(
    proceso_id: int, 
    actualizacion: schemas.ProcesoATRUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Actualizar el estado de un proceso ATR"""
    proceso = db.query(models.ProcesoATR).filter(models.ProcesoATR.id == proceso_id).first()
    if not proceso: raise HTTPException(404, "Proceso ATR no encontrado")
    
    # Actualizar solo los campos proporcionados
    for key, value in actualizacion.dict(exclude_unset=True).items():
        setattr(proceso, key, value)
    
    db.commit()
    db.refresh(proceso)
    return proceso
