# ERP Modular Loviluz ⚡

Sistema de gestión integral (ERP/CRM) diseñado para comercializadoras de energía. Incluye gestión de clientes, facturación SEPA, análisis de facturas con IA y panel de operaciones ATR.

## 🚀 Tecnologías

- **Backend:** Python FastAPI, SQLAlchemy, Pydantic.
- **Frontend:** React, Vite, Tailwind CSS, Shadcn/ui, Recharts.
- **Base de Datos:** SQLite (Local) / PostgreSQL (Producción).
- **IA:** Google Gemini 1.5 Flash (Análisis de documentos y SQL).

---

## 🛠️ Instalación y Uso Local

### 1. Requisitos Previos

Asegúrate de tener instalados:

- **Python 3.9+**
- **Node.js 18+** (Incluye npm)
- Tener acceso a tus claves secretas (guardadas por separado).

### 2. Configuración e Inicio del Backend (API)

El Backend debe estar corriendo en `http://127.0.0.1:8000` antes de iniciar el Frontend.

1.  Navega a la carpeta del Backend:
    ```bash
    cd backend
    ```
2.  Crea y **Activa el entorno virtual** (CRÍTICO):

    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

    _(Verifica que veas `(venv)` al inicio de tu línea de comandos.)_

3.  Instala todas las librerías de Python:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configuración de Claves Secretas (.env)**:
    a. Copia el archivo de plantilla `.env.example` y renómbralo a **`.env`**:

    ```bash
    cp .env.example .env
    ```

    b. **Abre el archivo `.env`** y sustituye los marcadores por tus valores secretos reales (SECRET_KEY, GEMINI_API_KEY, DYNAMICS_CLIENT_ID, etc.).

5.  **Ejecución del Servidor (Nueva terminal):**
    ```bash
    uvicorn app.main:app --reload
    ```

### 3. Configuración e Inicio del Frontend (React/Vite)

1.  Abre una **NUEVA terminal** y navega a la carpeta del Frontend:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias de Node.js:

    ```bash
    npm install
    ```

3.  **Configuración del Entorno Frontend:**
    Crea un archivo llamado **`.env`** en la carpeta `frontend/` y añade la URL de la API:

    ```dotenv
    VITE_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
    ```

4.  **Ejecución del Cliente:**
    Arranca el servidor de desarrollo de React:
    ```bash
    npm run dev
    ```
    El Frontend se abrirá en tu navegador (probablemente en `http://localhost:5173`).

### 4. Primer Uso (Crear Administrador)

Una vez que el Backend y el Frontend estén corriendo, ejecuta este comando en una TERCERA terminal (con el entorno `venv` activado) para crear tu usuario Admin:

```bash
# (Asegúrate de cambiar 'tu_email@ejemplo.com')
python make_admin.py
```
