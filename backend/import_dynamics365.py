"""
Script para importar datos desde Dynamics 365 a la base de datos local
Importa cuentas (clientes), contactos y oportunidades
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.modules.crm import models
from app.modules.dynamics365.connector import Dynamics365Connector
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Asegurar que las tablas existen
models.Base.metadata.create_all(bind=engine)


def importar_cuentas(dynamics: Dynamics365Connector, db: Session):
    """Importa cuentas (clientes) desde Dynamics 365"""
    logger.info("📊 Importando cuentas desde Dynamics 365...")
    
    try:
        # Obtener todas las cuentas activas
        accounts = dynamics.get_accounts(active_only=True)
        logger.info(f"✅ Se obtuvieron {len(accounts)} cuentas de Dynamics 365")
        
        clientes_nuevos = 0
        clientes_actualizados = 0
        
        for account in accounts:
            try:
                # Usar el número de cuenta o el ID como identificador único
                identificador = account.get("accountnumber") or account.get("accountid")
                
                if not identificador:
                    continue
                
                # Buscar si ya existe el cliente
                cliente = db.query(models.Cliente).filter(
                    models.Cliente.nif_cif == identificador
                ).first()
                
                datos_cliente = {
                    "nombre": account.get("name", "Desconocido"),
                    "nif_cif": identificador,
                    "email": account.get("emailaddress1", ""),
                    "telefono": account.get("telephone1", ""),
                    "direccion": account.get("address1_line1", ""),
                    "ciudad": account.get("address1_city", ""),
                    "codigo_postal": account.get("address1_postalcode", ""),
                    "provincia": account.get("address1_stateorprovince", ""),
                    "tipo_cliente": "Dynamics 365"
                }
                
                if not cliente:
                    # Crear nuevo cliente
                    cliente = models.Cliente(**datos_cliente)
                    db.add(cliente)
                    clientes_nuevos += 1
                else:
                    # Actualizar cliente existente
                    for key, value in datos_cliente.items():
                        if value:  # Solo actualizar si hay valor
                            setattr(cliente, key, value)
                    clientes_actualizados += 1
                
                if (clientes_nuevos + clientes_actualizados) % 50 == 0:
                    db.commit()
                    logger.info(f"⏳ Procesados {clientes_nuevos + clientes_actualizados} clientes...")
                    
            except Exception as e:
                logger.warning(f"⚠️ Error procesando cuenta {account.get('name')}: {str(e)}")
                continue
        
        db.commit()
        
        logger.info(f"\n{'='*80}")
        logger.info(f"✅ CUENTAS IMPORTADAS:")
        logger.info(f"   • Clientes nuevos: {clientes_nuevos}")
        logger.info(f"   • Clientes actualizados: {clientes_actualizados}")
        logger.info(f"{'='*80}\n")
        
    except Exception as e:
        logger.error(f"❌ Error importando cuentas: {str(e)}")
        db.rollback()
        raise


def importar_contactos(dynamics: Dynamics365Connector, db: Session):
    """Importa contactos desde Dynamics 365"""
    logger.info("📊 Importando contactos desde Dynamics 365...")
    
    try:
        # Obtener todos los contactos activos
        contacts = dynamics.get_contacts(active_only=True)
        logger.info(f"✅ Se obtuvieron {len(contacts)} contactos de Dynamics 365")
        
        contactos_nuevos = 0
        contactos_actualizados = 0
        
        for contact in contacts:
            try:
                email = contact.get("emailaddress1", "").strip()
                
                if not email:
                    continue
                
                # Buscar si ya existe el cliente por email
                cliente = db.query(models.Cliente).filter(
                    models.Cliente.email == email
                ).first()
                
                nombre_completo = contact.get("fullname") or \
                                f"{contact.get('firstname', '')} {contact.get('lastname', '')}".strip()
                
                datos_contacto = {
                    "nombre": nombre_completo or "Sin nombre",
                    "email": email,
                    "telefono": contact.get("telephone1") or contact.get("mobilephone", ""),
                    "persona_contacto": nombre_completo,
                    "tipo_cliente": "Contacto D365"
                }
                
                if not cliente:
                    # Crear nuevo cliente desde contacto
                    cliente = models.Cliente(
                        nif_cif=contact.get("contactid", ""),
                        **datos_contacto
                    )
                    db.add(cliente)
                    contactos_nuevos += 1
                else:
                    # Actualizar datos de contacto
                    for key, value in datos_contacto.items():
                        if value:
                            setattr(cliente, key, value)
                    contactos_actualizados += 1
                
                if (contactos_nuevos + contactos_actualizados) % 50 == 0:
                    db.commit()
                    logger.info(f"⏳ Procesados {contactos_nuevos + contactos_actualizados} contactos...")
                    
            except Exception as e:
                logger.warning(f"⚠️ Error procesando contacto: {str(e)}")
                continue
        
        db.commit()
        
        logger.info(f"\n{'='*80}")
        logger.info(f"✅ CONTACTOS IMPORTADOS:")
        logger.info(f"   • Contactos nuevos: {contactos_nuevos}")
        logger.info(f"   • Contactos actualizados: {contactos_actualizados}")
        logger.info(f"{'='*80}\n")
        
    except Exception as e:
        logger.error(f"❌ Error importando contactos: {str(e)}")
        db.rollback()
        raise


def importar_oportunidades(dynamics: Dynamics365Connector, db: Session):
    """Importa oportunidades desde Dynamics 365"""
    logger.info("📊 Importando oportunidades desde Dynamics 365...")
    
    try:
        # Obtener todas las oportunidades abiertas
        opportunities = dynamics.get_opportunities(active_only=True)
        logger.info(f"✅ Se obtuvieron {len(opportunities)} oportunidades de Dynamics 365")
        
        # Aquí podrías crear una tabla de Oportunidades si la necesitas
        # Por ahora solo mostramos la información
        
        logger.info(f"\n{'='*80}")
        logger.info(f"📋 OPORTUNIDADES ENCONTRADAS: {len(opportunities)}")
        logger.info(f"{'='*80}\n")
        
        # Mostrar resumen de las primeras 10 oportunidades
        for i, opp in enumerate(opportunities[:10]):
            logger.info(f"  {i+1}. {opp.get('name')} - Valor: {opp.get('estimatedvalue', 0)}")
        
        if len(opportunities) > 10:
            logger.info(f"  ... y {len(opportunities) - 10} más")
        
    except Exception as e:
        logger.error(f"❌ Error importando oportunidades: {str(e)}")
        raise


def importar_todo():
    """Ejecuta la importación completa desde Dynamics 365"""
    db = SessionLocal()
    
    try:
        logger.info("🚀 INICIANDO IMPORTACIÓN DESDE DYNAMICS 365")
        logger.info("="*80)
        
        # Inicializar conector de Dynamics 365
        dynamics = Dynamics365Connector()
        
        # Importar cuentas
        importar_cuentas(dynamics, db)
        
        # Importar contactos
        importar_contactos(dynamics, db)
        
        # Importar oportunidades (opcional, solo para mostrar)
        importar_oportunidades(dynamics, db)
        
        logger.info("\n" + "="*80)
        logger.info("✅ ¡IMPORTACIÓN DESDE DYNAMICS 365 COMPLETADA!")
        logger.info("="*80)
        
    except Exception as e:
        logger.error(f"\n❌ Error crítico en la importación: {str(e)}")
        logger.error("Verifica que:")
        logger.error("  1. Las credenciales en .env son correctas")
        logger.error("  2. La aplicación tiene permisos en Azure AD")
        logger.error("  3. La URL de Dynamics 365 es correcta")
        logger.error("  4. Tienes conexión a internet")
    finally:
        db.close()


def test_conexion():
    """Prueba la conexión a Dynamics 365 sin importar datos"""
    logger.info("🔍 Probando conexión a Dynamics 365...")
    
    try:
        dynamics = Dynamics365Connector()
        
        # Intentar obtener solo 1 cuenta para probar
        resultado = dynamics.query("accounts", params={"$top": 1})
        
        if "value" in resultado:
            logger.info("✅ Conexión exitosa a Dynamics 365")
            logger.info(f"📊 Se puede acceder a la API correctamente")
            return True
        else:
            logger.error("❌ Respuesta inesperada de Dynamics 365")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error en la conexión: {str(e)}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Modo de prueba
        test_conexion()
    else:
        # Importación completa
        importar_todo()
