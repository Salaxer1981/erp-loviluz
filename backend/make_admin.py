from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.modules.crm import models

# Conectar a la Base de Datos
db = SessionLocal()

def hacer_admin(email_usuario):
    print(f"🔍 Buscando usuario: {email_usuario}...")
    user = db.query(models.User).filter(models.User.email == email_usuario).first()
    
    if not user:
        print("❌ Error: Usuario no encontrado. Regístrate primero en la web.")
        return

    print(f"👤 Usuario encontrado: {user.email} (Rol actual: {user.role})")
    
    # Cambio de Rol
    user.role = "admin"
    db.commit()
    db.refresh(user)
    
    print(f"✅ ¡ÉXITO! El usuario {user.email} ahora es ADMIN supremo.")

if __name__ == "__main__":
    # CAMBIA ESTO POR TU EMAIL REAL
    email = input("Introduce tu email de registro: ")
    hacer_admin(email)