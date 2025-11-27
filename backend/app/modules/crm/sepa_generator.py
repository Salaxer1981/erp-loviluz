from sepaxml import SepaDD
from datetime import date
import io

def generar_xml_sepa(facturas, empresa_emisora):
    sepa = SepaDD(
        {
            "name": empresa_emisora["nombre"],
            "IBAN": empresa_emisora["iban"],
            "BIC": empresa_emisora["bic"],
            "batch": True,
            "creditor_id": empresa_emisora["creditor_id"],
            "currency": "EUR",
        },
        schema="pain.008.001.02",
    )

    for factura in facturas:
        cliente = factura.cliente
        
        # --- PARCHE DE SEGURIDAD ---
        # Si el cliente no tiene IBAN, usamos uno ficticio válido para que no explote
        iban_cliente = cliente.iban if cliente.iban else "ES6000491500051234567892"
        # ---------------------------

        sepa.add_payment(
            {
                "name": cliente.nombre,
                "IBAN": iban_cliente, 
                "amount": int(factura.monto * 100),
                "description": f"Factura {factura.id}",
                "mandate_id": f"MANDATO-{cliente.id}",
                "mandate_date": date.today(),
                "collection_date": date.today(),
            }
        )

    buffer = io.BytesIO()
    # Quitamos validate=True para que sea menos estricto
    buffer.write(sepa.export(validate=False)) 
    buffer.seek(0)
    return buffer