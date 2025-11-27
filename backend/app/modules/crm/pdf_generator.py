from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.colors import HexColor # Importamos para usar Hex
from datetime import datetime
import io

def generar_pdf_factura(factura, cliente):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # 1. CABECERA (Azul Oscuro) - CAMBIO AQUÍ
    # Usamos HexColor en lugar de MidnightBlue para evitar errores
    c.setFillColor(HexColor('#1e3a8a')) 
    c.rect(0, height - 120, width, 120, fill=True, stroke=False)
    
    # Texto Logo
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(40, height - 50, "LOVILUZ")
    c.setFont("Helvetica", 12)
    c.drawString(40, height - 70, "Gestión Energética Integral")

    # Datos Factura
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(width - 40, height - 50, "FACTURA")
    c.setFont("Helvetica", 12)
    c.drawRightString(width - 40, height - 70, f"Nº: {factura.id:05d}")
    
    fecha = factura.created_at.strftime("%d/%m/%Y") if factura.created_at else datetime.now().strftime("%d/%m/%Y")
    c.drawRightString(width - 40, height - 90, f"Fecha: {fecha}")

    # 2. CLIENTE
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 160, "FACTURAR A:")
    
    c.setFont("Helvetica", 12)
    c.drawString(40, height - 180, f"{cliente.nombre}")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.gray)
    c.drawString(40, height - 195, f"{cliente.empresa}")
    c.drawString(40, height - 210, f"{cliente.email}")
    if cliente.telefono:
        c.drawString(40, height - 225, f"Tel: {cliente.telefono}")

    # 3. TABLA
    y_inicio = height - 280
    
    # Fondo gris claro para encabezados
    c.setFillColor(HexColor('#f3f4f6')) 
    c.rect(40, y_inicio, width - 80, 25, fill=True, stroke=False)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_inicio + 8, "DESCRIPCIÓN")
    c.drawRightString(width - 50, y_inicio + 8, "IMPORTE")

    # Items
    y_item = y_inicio - 30
    c.setFont("Helvetica", 11)
    c.drawString(50, y_item, factura.concepto)
    c.drawRightString(width - 50, y_item, f"{factura.monto:.2f} €")
    
    c.setStrokeColor(colors.lightgrey)
    c.line(40, y_item - 15, width - 40, y_item - 15)

    # 4. TOTALES
    y_total = y_item - 60
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(HexColor('#1e3a8a')) # Azul otra vez
    c.drawRightString(width - 50, y_total, f"TOTAL: {factura.monto:.2f} €")

    # 5. PIE
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.gray)
    c.drawCentredString(width / 2, 30, "Documento generado por ERP Modular - Powered by Crazy Digital 🚀")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer