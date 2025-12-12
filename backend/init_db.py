from app.database import engine, Base
from app.modules.crm import models  # Importamos los modelos para que SQLAlchemy los "vea"

print("🔄 Creando tablas en la base de datos...")

try:
    # Esta es la orden que crea el archivo y las tablas
    models.Base.metadata.create_all(bind=engine)
    print("✅ ¡ÉXITO! Base de datos 'crm_database.db' creada correctamente.")
    print("   Tablas creadas: Clientes, PuntosSuministro, Contratos, Facturas, Usuarios, Documentos, ProcesosATR")
except Exception as e:
    print(f"❌ Error creando la base de datos: {e}")