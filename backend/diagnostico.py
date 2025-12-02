import pandas as pd

archivo = "cartera.xlsx"
hoja = "2-Contratos-Listado-energía"

print(f"📂 Analizando {archivo} - Hoja: {hoja}\n")

# Leer la hoja correcta con header=1 (fila 2 son los encabezados)
df = pd.read_excel(archivo, sheet_name=hoja, header=1)

print(f"✅ Datos cargados: {len(df)} filas x {len(df.columns)} columnas\n")

print("📋 TODAS LAS COLUMNAS DISPONIBLES:")
print("="*60)
for idx, col in enumerate(df.columns, 1):
    print(f"{idx:3d}. {col}")

print("\n" + "="*60)
print("📊 PRIMERAS 3 FILAS DE DATOS:")
print("="*60)
print(df.head(3))

# Buscar columnas clave
print("\n" + "="*60)
print("🔍 BUSCANDO COLUMNAS CLAVE:")
print("="*60)

columnas_clave = {
    "CUPS": [col for col in df.columns if "CUPS" in str(col).upper()],
    "CIF/NIF": [col for col in df.columns if "CIF" in str(col).upper() or "NIF" in str(col).upper() or "CLIENTE" in str(col).upper()],
    "Nombre": [col for col in df.columns if "NOMBRE" in str(col).upper() or "RAZON" in str(col).upper()],
    "Dirección": [col for col in df.columns if "DIRECC" in str(col).upper() or "DOMICILIO" in str(col).upper()],
    "Tarifa": [col for col in df.columns if "TARIFA" in str(col).upper()],
}

for clave, columnas in columnas_clave.items():
    if columnas:
        print(f"✅ {clave}: {columnas}")
    else:
        print(f"❌ {clave}: No encontrada")
