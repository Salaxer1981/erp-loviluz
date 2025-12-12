import requests
import json

BASE_URL = "http://localhost:8000"

print("🧪 PROBANDO SISTEMA DE RENOVACIONES")
print("=" * 80)

# 1. Probar endpoint del dashboard (debe incluir 'por_vencer')
print("\n1️⃣ Probando Dashboard Stats...")
try:
    response = requests.get(f"{BASE_URL}/dashboard-stats/")
    if response.status_code == 200:
        data = response.json()
        print("✅ Dashboard Stats OK")
        print(f"   • Total clientes: {data.get('total_clientes')}")
        print(f"   • Clientes activos: {data.get('activos')}")
        print(f"   • ⚠️  CONTRATOS POR VENCER: {data.get('por_vencer', 'NO DISPONIBLE')}")
    else:
        print(f"❌ Error: {response.status_code}")
except Exception as e:
    print(f"❌ Error conectando al servidor: {e}")

# 2. Probar endpoint de renovaciones pendientes
print("\n2️⃣ Probando Listado de Renovaciones Pendientes...")
try:
    response = requests.get(f"{BASE_URL}/renovaciones/pendientes")
    if response.status_code == 200:
        renovaciones = response.json()
        print(f"✅ Endpoint OK - {len(renovaciones)} contratos por vencer")
        
        if len(renovaciones) > 0:
            print("\n📋 PRIMEROS 5 CONTRATOS MÁS URGENTES:")
            for i, contrato in enumerate(renovaciones[:5], 1):
                print(f"\n   {i}. Cliente: {contrato.get('cliente')}")
                print(f"      CUPS: {contrato.get('cups')}")
                print(f"      Comercializadora: {contrato.get('comercializadora')}")
                print(f"      Fecha vencimiento: {contrato.get('fecha_fin')}")
                print(f"      ⏰ Días restantes: {contrato.get('dias_restantes')}")
                print(f"      Teléfono: {contrato.get('telefono')}")
        else:
            print("   ℹ️  No hay contratos por vencer en los próximos 45 días")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"   Respuesta: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("✅ Pruebas completadas")
