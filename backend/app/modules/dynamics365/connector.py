"""
Conector para Microsoft Dynamics 365
Permite autenticación y consultas a la API Web de Dynamics 365
"""
import os
import msal
import requests
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


class Dynamics365Connector:
    """Clase para conectar y consultar Dynamics 365 CRM"""
    
    def __init__(self):
        """Inicializa el conector con las credenciales desde .env"""
        self.client_id = os.getenv("DYNAMICS_CLIENT_ID")
        self.client_secret = os.getenv("DYNAMICS_CLIENT_SECRET")
        self.tenant_id = os.getenv("DYNAMICS_TENANT_ID")
        self.dynamics_url = os.getenv("DYNAMICS_URL")
        
        # Validar que todas las credenciales estén presentes
        if not all([self.client_id, self.client_secret, self.tenant_id, self.dynamics_url]):
            raise ValueError(
                "❌ Faltan credenciales de Dynamics 365. "
                "Verifica que DYNAMICS_CLIENT_ID, DYNAMICS_CLIENT_SECRET, "
                "DYNAMICS_TENANT_ID y DYNAMICS_URL estén en el archivo .env"
            )
        
        # Normalizar URL (quitar barra final si existe)
        self.dynamics_url = self.dynamics_url.rstrip('/')
        self.api_url = f"{self.dynamics_url}/api/data/v9.2"
        
        # Configuración de MSAL
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.scope = [f"{self.dynamics_url}/.default"]
        
        self.access_token = None
        logger.info(f"✅ Dynamics365Connector inicializado para: {self.dynamics_url}")
    
    def _get_access_token(self) -> str:
        """Obtiene un token de acceso usando MSAL"""
        try:
            app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret
            )
            
            result = app.acquire_token_for_client(scopes=self.scope)
            
            if "access_token" in result:
                logger.info("✅ Token de acceso obtenido correctamente")
                return result["access_token"]
            else:
                error_msg = result.get("error_description", result.get("error", "Unknown error"))
                raise Exception(f"❌ Error obteniendo token: {error_msg}")
                
        except Exception as e:
            logger.error(f"❌ Error en autenticación: {str(e)}")
            raise
    
    def _get_headers(self) -> Dict[str, str]:
        """Devuelve los headers necesarios para las peticiones"""
        if not self.access_token:
            self.access_token = self._get_access_token()
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "Prefer": "return=representation"
        }
    
    def query(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Realiza una consulta GET a Dynamics 365
        
        Args:
            endpoint: El endpoint a consultar (ej: 'accounts', 'contacts')
            params: Parámetros adicionales de la query
        
        Returns:
            Diccionario con la respuesta JSON
        """
        try:
            url = f"{self.api_url}/{endpoint}"
            headers = self._get_headers()
            
            logger.info(f"🔍 Consultando: {url}")
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            # Si el token expiró, renovarlo e intentar de nuevo
            if response.status_code == 401:
                logger.warning("⚠️ Token expirado, renovando...")
                self.access_token = None
                headers = self._get_headers()
                response = requests.get(url, headers=headers, params=params, timeout=30)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error en la petición: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Detalles: {e.response.text}")
            raise
    
    def get_all_records(self, endpoint: str, select_fields: Optional[List[str]] = None, 
                       filter_query: Optional[str] = None, max_records: int = 5000) -> List[Dict]:
        """
        Obtiene todos los registros de una entidad (con paginación automática)
        
        Args:
            endpoint: Nombre de la entidad (ej: 'accounts', 'contacts')
            select_fields: Lista de campos a seleccionar
            filter_query: Filtro OData (ej: "statecode eq 0")
            max_records: Número máximo de registros a obtener
        
        Returns:
            Lista de registros
        """
        records = []
        params = {}
        
        if select_fields:
            params["$select"] = ",".join(select_fields)
        
        if filter_query:
            params["$filter"] = filter_query
        
        # Limitar registros por página
        params["$top"] = min(max_records, 5000)
        
        try:
            while True:
                result = self.query(endpoint, params)
                
                if "value" in result:
                    records.extend(result["value"])
                    logger.info(f"📊 Obtenidos {len(records)} registros hasta ahora...")
                
                # Verificar si hay más páginas
                if "@odata.nextLink" in result and len(records) < max_records:
                    # Extraer solo el query string del nextLink
                    next_url = result["@odata.nextLink"]
                    endpoint = next_url.replace(f"{self.api_url}/", "")
                    params = {}  # Los parámetros ya están en el nextLink
                else:
                    break
            
            logger.info(f"✅ Total de registros obtenidos: {len(records)}")
            return records[:max_records]
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo registros: {str(e)}")
            raise
    
    def get_accounts(self, active_only: bool = True) -> List[Dict]:
        """
        Obtiene todas las cuentas (clientes)
        
        Args:
            active_only: Si True, solo obtiene cuentas activas
        
        Returns:
            Lista de cuentas
        """
        fields = [
            "accountid",
            "name",
            "accountnumber",
            "emailaddress1",
            "telephone1",
            "address1_line1",
            "address1_city",
            "address1_postalcode",
            "address1_stateorprovince"
        ]
        
        filter_query = "statecode eq 0" if active_only else None
        
        return self.get_all_records("accounts", select_fields=fields, filter_query=filter_query)
    
    def get_contacts(self, active_only: bool = True) -> List[Dict]:
        """
        Obtiene todos los contactos
        
        Args:
            active_only: Si True, solo obtiene contactos activos
        
        Returns:
            Lista de contactos
        """
        fields = [
            "contactid",
            "fullname",
            "firstname",
            "lastname",
            "emailaddress1",
            "telephone1",
            "mobilephone"
        ]
        
        filter_query = "statecode eq 0" if active_only else None
        
        return self.get_all_records("contacts", select_fields=fields, filter_query=filter_query)
    
    def get_opportunities(self, active_only: bool = True) -> List[Dict]:
        """
        Obtiene todas las oportunidades
        
        Args:
            active_only: Si True, solo obtiene oportunidades abiertas
        
        Returns:
            Lista de oportunidades
        """
        fields = [
            "opportunityid",
            "name",
            "estimatedvalue",
            "estimatedclosedate",
            "closeprobability",
            "stepname"
        ]
        
        filter_query = "statecode eq 0" if active_only else None
        
        return self.get_all_records("opportunities", select_fields=fields, filter_query=filter_query)
    
    def create_record(self, entity: str, data: Dict) -> Dict:
        """
        Crea un nuevo registro en Dynamics 365
        
        Args:
            entity: Nombre de la entidad (ej: 'accounts', 'contacts')
            data: Diccionario con los datos del registro
        
        Returns:
            Diccionario con el registro creado
        """
        try:
            url = f"{self.api_url}/{entity}"
            headers = self._get_headers()
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            logger.info(f"✅ Registro creado en {entity}")
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error creando registro: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Detalles: {e.response.text}")
            raise
    
    def update_record(self, entity: str, record_id: str, data: Dict) -> bool:
        """
        Actualiza un registro existente
        
        Args:
            entity: Nombre de la entidad
            record_id: ID del registro a actualizar
            data: Diccionario con los campos a actualizar
        
        Returns:
            True si se actualizó correctamente
        """
        try:
            url = f"{self.api_url}/{entity}({record_id})"
            headers = self._get_headers()
            
            response = requests.patch(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            logger.info(f"✅ Registro actualizado en {entity}")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error actualizando registro: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Detalles: {e.response.text}")
            raise
    
    def delete_record(self, entity: str, record_id: str) -> bool:
        """
        Elimina un registro
        
        Args:
            entity: Nombre de la entidad
            record_id: ID del registro a eliminar
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            url = f"{self.api_url}/{entity}({record_id})"
            headers = self._get_headers()
            
            response = requests.delete(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            logger.info(f"✅ Registro eliminado de {entity}")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error eliminando registro: {str(e)}")
            raise
