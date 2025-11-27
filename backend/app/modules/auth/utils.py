from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

# Configuración secreta (En producción esto va en variables de entorno)
SECRET_KEY = "mi_clave_secreta_super_segura"
ALGORITHM = "HS256"

# Gestor de encriptación
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# 1. Función para verificar contraseña
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 2. Función para encriptar contraseña
def get_password_hash(password):
    return pwd_context.hash(password)

# 3. Función para crear el Token (El carnet digital)
def create_access_token(data: dict):
    to_encode = data.copy()
    # El token expira en 60 minutos
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt