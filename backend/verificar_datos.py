from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.modules.crm import models

def verificar_base_datos():
    db: Session = SessionLocal()
    
    print("\n" + "="*80)
    print("📊 VERIFICACIÓN DE BASE DE DATOS")
    print("="*80)
    
    try:
        # Contar registros
        total_clientes = db.query(models.Cliente).count()
        total_puntos = db.query(models.PuntoSuministro).count()
        total_contratos = db.query(models.Contrato).count()
        total_usuarios = db.query(models.User).count()
        total_documentos = db.query(models.Documento).count()
        total_facturas = db.query(models.Factura).count()
        
        print(f"\n📈 TOTALES:")
        print(f"   • Clientes: {total_clientes}")
        print(f"   • Puntos de suministro: {total_puntos}")
        print(f"   • Contratos: {total_contratos}")
        print(f"   • Usuarios: {total_usuarios}")
        print(f"   • Documentos: {total_documentos}")
        print(f"   • Facturas: {total_facturas}")
        
        # Mostrar algunos ejemplos
        if total_clientes > 0:
            print(f"\n👤 PRIMEROS 5 CLIENTES:")
            clientes = db.query(models.Cliente).limit(5).all()
            for c in clientes:
                print(f"   • {c.nombre} - NIF: {c.nif_cif}")
        
        if total_contratos > 0:
            print(f"\n📋 PRIMEROS 5 CONTRATOS:")
            contratos = db.query(models.Contrato).limit(5).all()
            for contrato in contratos:
                punto = db.query(models.PuntoSuministro).filter(
                    models.PuntoSuministro.id == contrato.punto_suministro_id
                ).first()
                if punto:
                    print(f"   • CUPS: {punto.cups} - Comercializadora: {contrato.comercializadora}")
        
        # Estadísticas por comercializadora
        print(f"\n📊 CONTRATOS POR COMERCIALIZADORA:")
        from sqlalchemy import func
        stats = db.query(
            models.Contrato.comercializadora,
            func.count(models.Contrato.id).label('total')
        ).group_by(models.Contrato.comercializadora).all()
        
        for comercializadora, total in stats[:10]:  # Top 10
            print(f"   • {comercializadora}: {total} contratos")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verificar_base_datos()
