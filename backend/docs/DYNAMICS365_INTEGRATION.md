# Integración con Dynamics 365

## 📋 Requisitos Previos

### 1. **Credenciales de Azure AD (Active Directory)**

Necesitas registrar una aplicación en Azure AD para obtener:

- `CLIENT_ID` (Application/Client ID)
- `CLIENT_SECRET` (Client Secret Value)
- `TENANT_ID` (Directory/Tenant ID)
- `DYNAMICS_URL` (URL de tu instancia, ej: `https://tu-org.crm4.dynamics.com`)

### 2. **Permisos en Dynamics 365**

La aplicación debe tener permisos:

- `Dynamics CRM` > `user_impersonation`
- O permisos específicos según las entidades que necesites

### 3. **Librerías Python Necesarias**

```bash
pip install msal requests pandas python-dotenv
```

## 🔧 Configuración

### Paso 1: Añadir credenciales al archivo `.env`

```env
# Dynamics 365 Credentials
DYNAMICS_CLIENT_ID=tu-client-id
DYNAMICS_CLIENT_SECRET=tu-client-secret
DYNAMICS_TENANT_ID=tu-tenant-id
DYNAMICS_URL=https://tu-org.crm4.dynamics.com
```

### Paso 2: Crear módulo de conexión

Ver archivo: `backend/app/modules/dynamics365/connector.py`

## 📊 Entidades Comunes en Dynamics 365

- **accounts** - Cuentas/Clientes
- **contacts** - Contactos
- **opportunities** - Oportunidades
- **leads** - Clientes potenciales
- **invoices** - Facturas
- **quotes** - Presupuestos
- **orders** - Pedidos
- **products** - Productos

## 🚀 Uso Básico

```python
from app.modules.dynamics365.connector import Dynamics365Connector

# Inicializar conexión
dynamics = Dynamics365Connector()

# Obtener todos los clientes (accounts)
clientes = dynamics.get_accounts()

# Obtener contactos
contactos = dynamics.get_contacts()

# Query personalizado (OData)
query = "accounts?$select=name,accountnumber&$filter=statecode eq 0&$top=100"
datos = dynamics.query(query)
```

## 🔍 Ejemplos de Queries OData

### Obtener cuentas activas

```
accounts?$select=name,accountnumber,emailaddress1,telephone1&$filter=statecode eq 0
```

### Obtener contratos

```
contracts?$select=title,contractnumber,activeon,expireson&$expand=customerid_account($select=name)
```

### Filtros avanzados

```
accounts?$filter=revenue gt 100000 and statecode eq 0&$orderby=revenue desc
```

## ⚠️ Limitaciones

- **Límite de registros**: Por defecto 5000 registros por petición
- **Rate limiting**: Límites de API según tu licencia
- **Paginación**: Usar `@odata.nextLink` para obtener más resultados

## 🔐 Seguridad

- ❌ NUNCA commits las credenciales al repositorio
- ✅ Usa variables de entorno
- ✅ Rota los secretos periódicamente
- ✅ Usa el principio de mínimo privilegio

## 📚 Referencias

- [Web API Dynamics 365](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [OData Query Options](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query-data-web-api)
- [MSAL Python](https://msal-python.readthedocs.io/)
