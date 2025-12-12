import pandas as pd

print("🔍 DIAGNÓSTICO: Analizando estructura del Excel...")

try:
    # Leer el Excel
    df = pd.read_excel("cartera.xlsx", sheet_name="2-Contratos-Listado-energía", engine="openpyxl", header=1)
    
    # Limpiar nombres de columnas
    df.columns = df.columns.str.strip()
    
    print(f"\n📊 Total de filas: {len(df)}")
    print(f"📊 Total de columnas: {len(df.columns)}\n")
    
    print("=" * 80)
    print("TODAS LAS COLUMNAS DISPONIBLES:")
    print("=" * 80)
    for i, col in enumerate(df.columns, 1):
        print(f"{i:3d}. '{col}'")
    
    print("\n" + "=" * 80)
    print("PRIMERA FILA DE DATOS (para ver formato):")
    print("=" * 80)
    
    if len(df) > 0:
        primera_fila = df.iloc[0]
        for col in df.columns[:20]:  # Mostrar solo las primeras 20
            valor = primera_fila[col]
            print(f"{col}: {valor}")
    
    print("\n✅ Diagnóstico completo")
    
except Exception as e:
    print(f"❌ Error: {e}")
