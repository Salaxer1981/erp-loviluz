import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.modules.crm import models
from datetime import datetime

# Asegurar tablas
models.Base.metadata.create_all(bind=engine)

def limpiar_fecha(fecha):
    """Convierte fechas de Excel al formato de Python"""
    try:
        if pd.isna(fecha): return None
        return pd.to_datetime(fecha).date()
    except:
        return None

def limpiar_float(valor):
    """Limpia números con comas, símbolos de euro o textos raros"""
    try:
        if pd.isna(valor): return 0.0
        if isinstance(valor, (int, float)): return float(valor)
        # Limpieza agresiva: quita 'kW', '€', espacios y cambia coma por punto
        limpio = str(valor).replace("kW", "").replace("€", "").replace(".", "").replace(",", ".").strip()
        return float(limpio)
    except:
        return 0.0

def importar_cartera():
    db: Session = SessionLocal()
    print("🚀 Iniciando migración de cartera desde EXCEL...")

    try:
        # LEER EXCEL - Hoja correcta con header=1 (fila 2 son los encabezados)
        df = pd.read_excel("cartera.xlsx", sheet_name="2-Contratos-Listado-energía", engine="openpyxl", header=1)
        
        # Limpiar nombres de columnas (quitar espacios extra)
        df.columns = df.columns.str.strip()
        
        print(f"📊 Archivo cargado: {len(df)} filas x {len(df.columns)} columnas")
        print(f"📋 Primeras columnas: {list(df.columns)[:10]}")
        
        if "CIF/NIF" not in df.columns or "CUPS" not in df.columns:
            print("❌ ERROR: No encuentro las columnas 'CIF/NIF' o 'CUPS'.")
            print(f"Columnas disponibles: {list(df.columns)}")
            return

        contador = 0
        clientes_nuevos = 0
        clientes_existentes = 0
        puntos_nuevos = 0
        puntos_existentes = 0
        contratos_duplicados = 0
        sin_nif = 0
        sin_cups = 0
        
        for index, row in df.iterrows():
            try:
                # --- 1. CLIENTE ---
                nif = str(row.get("CIF/NIF", "")).strip()
                # Si no hay NIF válido, saltamos la fila
                if not nif or nif.lower() == "nan" or nif == "":
                    sin_nif += 1
                    continue
                
                # Buscamos si ya existe para no duplicar
                cliente = db.query(models.Cliente).filter(models.Cliente.nif_cif == nif).first()
                
                if not cliente:
                    cliente = models.Cliente(
                        nombre=str(row.get("Cliente", "Desconocido")),
                        nif_cif=nif,
                        email=str(row.get("Email", "")),
                        telefono=str(row.get("Teléfono", "")),
                        iban=str(row.get("IBAN", "")),
                        persona_contacto=str(row.get("Firmante", "")),
                        tipo_cliente="Cartera 2025"
                    )
                    db.add(cliente)
                    db.commit()
                    db.refresh(cliente)
                    clientes_nuevos += 1
                else:
                    clientes_existentes += 1

                # --- 2. PUNTO DE SUMINISTRO (CUPS) ---
                cups_codigo = str(row.get("CUPS", "")).strip()
                
                # Validación básica de CUPS
                if not cups_codigo or len(cups_codigo) < 10 or cups_codigo.lower() == "nan" or cups_codigo == "":
                    sin_cups += 1
                    continue

                punto = db.query(models.PuntoSuministro).filter(models.PuntoSuministro.cups == cups_codigo).first()
                
                if not punto:
                    punto = models.PuntoSuministro(
                        cups=cups_codigo,
                        direccion=str(row.get("Domicilio CUPS", "")),
                        codigo_postal=str(row.get("Código postal CUPS", "")),
                        provincia=str(row.get("Provincia CUPS", "")),
                        tarifa_acceso=str(row.get("Tarifa", "")),
                        cliente_id=cliente.id
                    )
                    db.add(punto)
                    db.commit()
                    db.refresh(punto)
                    puntos_nuevos += 1
                else:
                    puntos_existentes += 1

                # --- 3. CONTRATO ---
                if punto:
                    # Evitar duplicar el mismo contrato si ya se importó
                    contrato_existe = db.query(models.Contrato).filter(models.Contrato.punto_suministro_id == punto.id).first()
                    
                    if not contrato_existe:
                        contrato = models.Contrato(
                            punto_suministro_id=punto.id,
                            comercializadora=str(row.get("Comercializadora", "Desconocida")),
                            producto=str(row.get("Producto", "")),
                            
                            # Fechas
                            fecha_inicio=limpiar_fecha(row.get("F. alta")),
                            fecha_fin=limpiar_fecha(row.get("F. vencimiento")),
                            
                            estado="Activo",
                            
                            # Potencias (Mapeo exacto a tu Excel)
                            p1=limpiar_float(row.get("Potencia (P1)")),
                            p2=limpiar_float(row.get("Potencia (P2)")),
                            p3=limpiar_float(row.get("Potencia (P3)")),
                            p4=limpiar_float(row.get("Potencia (P4)")),
                            p5=limpiar_float(row.get("Potencia (P5)")),
                            p6=limpiar_float(row.get("Potencia (P6)"))
                        )
                        db.add(contrato)
                        db.commit()
                        contador += 1
                        
                        if contador % 50 == 0: 
                            print(f"⏳ Procesados {contador} contratos...")
                    else:
                        contratos_duplicados += 1

            except Exception as e:
                # Si falla una fila, la mostramos pero seguimos con la siguiente
                # print(f"⚠️ Fila {index} ignorada: {e}")
                continue

        print(f"\n{'='*80}")
        print(f"✅ ¡IMPORTACIÓN FINALIZADA!")
        print(f"{'='*80}")
        print(f"📊 RESUMEN:")
        print(f"   • Contratos nuevos importados: {contador}")
        print(f"   • Clientes nuevos: {clientes_nuevos}")
        print(f"   • Clientes ya existentes: {clientes_existentes}")
        print(f"   • Puntos de suministro nuevos: {puntos_nuevos}")
        print(f"   • Puntos de suministro ya existentes: {puntos_existentes}")
        print(f"   • Contratos duplicados (ya existían): {contratos_duplicados}")
        print(f"\n⚠️  FILAS IGNORADAS:")
        print(f"   • Sin NIF/CIF válido: {sin_nif}")
        print(f"   • Sin CUPS válido: {sin_cups}")
        print(f"{'='*80}")

    except Exception as e:
        print(f"❌ Error crítico leyendo Excel: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    importar_cartera()
