"""
Servicio de integración con la API de Andreani.
Documentación oficial: https://developers.andreani.com/

Variables de entorno requeridas:
  ANDREANI_USERNAME      — usuario de la cuenta Andreani
  ANDREANI_PASSWORD      — contraseña de la cuenta Andreani
  ANDREANI_CLIENT_NUMBER — número de cliente/contrato
  ANDREANI_CP_ORIGEN     — código postal de origen (ej: 7167 para Chascomús)
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class AndreaniAPIError(Exception):
    """Error de comunicación con la API de Andreani."""
    pass


class AndreaniService:
    BASE_URL = "https://apis.andreani.com"
    _instance_token = None

    def __init__(self):
        self.username      = getattr(settings, 'ANDREANI_USERNAME', '')
        self.password      = getattr(settings, 'ANDREANI_PASSWORD', '')
        self.client_number = getattr(settings, 'ANDREANI_CLIENT_NUMBER', '')
        self.cp_origen     = getattr(settings, 'ANDREANI_CP_ORIGEN', '7167')
        self._token        = None

    # ── Auth ──────────────────────────────────────────────────────────────────

    def _get_token(self) -> str:
        """Obtiene y cachea el token Bearer de Andreani."""
        if self._token:
            return self._token
        if not self.username:
            raise AndreaniAPIError('ANDREANI_USERNAME no configurado.')
        try:
            resp = requests.post(
                f"{self.BASE_URL}/login",
                json={'usuario': self.username, 'password': self.password},
                timeout=10,
            )
            resp.raise_for_status()
            self._token = resp.json().get('token') or resp.headers.get('x-authorization-token')
            if not self._token:
                raise AndreaniAPIError('Andreani no devolvió token en la respuesta.')
            return self._token
        except requests.RequestException as e:
            raise AndreaniAPIError(f'Error de autenticación Andreani: {e}')

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._get_token()}',
            'Content-Type':  'application/json',
        }

    # ── Cotización ────────────────────────────────────────────────────────────

    def get_quote(self, postal_code_dest: str, weight_g: int, declared_value: float) -> dict:
        """
        Cotiza el envío a un código postal destino.

        Returns:
            {
                'cost': Decimal,
                'estimated_days': int,
                'service': str,
                'available': bool,
            }
        """
        if not self.username:
            # Modo sin credenciales — devolver estimación placeholder
            logger.warning('[ANDREANI] Credenciales no configuradas, usando tarifa local.')
            return {
                'cost':           0,
                'estimated_days': 5,
                'service':        'Andreani (no configurado)',
                'available':      False,
            }
        try:
            params = {
                'cpOrigen':       self.cp_origen,
                'cpDestino':      postal_code_dest,
                'pesoBulto':      max(weight_g / 1000, 0.1),  # kg, mínimo 100g
                'contrato':       self.client_number,
                'valorDeclarado': declared_value,
            }
            resp = requests.get(
                f"{self.BASE_URL}/v1/tarifas",
                params=params,
                headers=self._headers(),
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                'cost':           data.get('tarifaConIva', 0),
                'estimated_days': data.get('plazoEntrega', 5),
                'service':        data.get('descripcionServicio', 'Andreani A Domicilio'),
                'available':      True,
            }
        except requests.RequestException as e:
            raise AndreaniAPIError(f'Error al cotizar con Andreani: {e}')

    # ── Crear envío ───────────────────────────────────────────────────────────

    def create_shipment(self, order) -> dict:
        """
        Genera una guía de envío en Andreani para la orden dada.

        Returns:
            {
                'tracking_number': str,
                'label_url': str,
                'service_type': str,
                'cost': float,
                'raw': dict,
            }
        """
        if not self.username:
            logger.warning('[ANDREANI] Credenciales no configuradas, envío simulado.')
            return {
                'tracking_number': f'SIMULADO-{str(order.id)[:8].upper()}',
                'label_url':       '',
                'service_type':    'Simulado (sin credenciales)',
                'cost':            0,
                'raw':             {},
            }

        total_weight_g = sum(
            (item.product.weight_g or 500) * item.quantity
            for item in order.items.select_related('product')
        )

        payload = {
            'contrato': self.client_number,
            'destinatario': {
                'nombreCompleto': order.shipping_name,
                'email':          order.contact_email or '',
                'documentoTipo':  'DNI',
                'telefonos':      [{'numero': order.shipping_phone or ''}],
            },
            'domicilioDestino': {
                'calle':        order.shipping_address or '',
                'codigoPostal': order.shipping_postal or '',
                'localidad':    order.shipping_city or '',
                'provincia':    order.shipping_province or '',
            },
            'bultos': [{
                'kilos':          max(total_weight_g / 1000, 0.1),
                'largoCm':        30,
                'anchoCm':        30,
                'altoCm':         20,
                'valorDeclarado': float(order.total),
                'referencia1':    str(order.id)[:20],
            }],
        }

        try:
            resp = requests.post(
                f"{self.BASE_URL}/v1/ordenes-de-envio",
                json=payload,
                headers=self._headers(),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                'tracking_number': data.get('nroAndreani', ''),
                'label_url':       data.get('etiqueta', ''),
                'service_type':    data.get('servicio', 'Andreani A Domicilio'),
                'cost':            data.get('tarifa', 0),
                'raw':             data,
            }
        except requests.RequestException as e:
            raise AndreaniAPIError(f'Error al crear envío en Andreani: {e}')

    # ── Tracking ──────────────────────────────────────────────────────────────

    def get_tracking(self, tracking_number: str) -> dict:
        """
        Consulta el estado de un envío por su número de tracking.
        """
        if not self.username:
            return {'estado': 'SIMULADO', 'eventos': []}
        try:
            resp = requests.get(
                f"{self.BASE_URL}/v1/envios/{tracking_number}",
                headers=self._headers(),
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            raise AndreaniAPIError(f'Error al consultar tracking Andreani: {e}')

    # ── Mapeo de estados ──────────────────────────────────────────────────────

    @staticmethod
    def map_status(andreani_status: str) -> str:
        """Traduce estados de Andreani a estados internos del sistema."""
        mapping = {
            'EN DEPOSITO':          'created',
            'EN CAMINO':            'in_transit',
            'EN REPARTO':           'in_transit',
            'ENTREGADO':            'delivered',
            'NO ENTREGADO':         'failed',
            'DEVOLUCION EN CAMINO': 'failed',
        }
        return mapping.get(andreani_status.upper(), 'in_transit')
