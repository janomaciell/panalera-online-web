"""
Email service — envío asincrónico con threading (sin Celery/Redis).
Todos los correos se despachan en un hilo daemon separado para no bloquear el request.
"""
import threading
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_recipient(order) -> str:
    """Returns the best available email for this order."""
    if order.user and order.user.email:
        return order.user.email
    return order.guest_email or ''


def _send_async(subject: str, to_email: str, template: str, context: dict):
    """Renders template and sends email in a background thread."""
    if not to_email:
        logger.warning(f'[EMAIL] No recipient for template {template}. Skipping.')
        return

    def _send():
        try:
            html_content = render_to_string(template, context)
            msg = EmailMultiAlternatives(
                subject   = subject,
                body      = _strip_tags(html_content),
                from_email= settings.DEFAULT_FROM_EMAIL,
                to        = [to_email],
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)
            logger.info(f'[EMAIL] Sent "{subject}" to {to_email}')
        except Exception as e:
            logger.error(f'[EMAIL] Failed to send "{subject}" to {to_email}: {e}')

    t = threading.Thread(target=_send, daemon=True)
    t.start()


def _strip_tags(html: str) -> str:
    """Naive HTML strip for plain-text fallback."""
    import re
    return re.sub(r'<[^>]+>', '', html).strip()


def _base_context(order) -> dict:
    """Context shared by all email templates."""
    cycle = order.shipping_cycle
    return {
        'order':        order,
        'customer_name': order.shipping_name.split()[0] if order.shipping_name else 'cliente',
        'order_id':     str(order.id)[:8].upper(),
        'items':        order.items.select_related('product').all(),
        'total':        order.total,
        'shipping_price': order.shipping_price,
        'is_pickup':    order.is_pickup,
        'shipping_city': order.shipping_city,
        'ship_date':    cycle.ship_date if cycle else None,
        'cutoff_date':  cycle.cutoff_date if cycle else None,
        'frontend_url': settings.FRONTEND_URL,
    }


# ── Public functions called by views and signals ──────────────────────────────

def send_order_confirmed(order):
    """Email 1: Pago aprobado — pedido confirmado."""
    _send_async(
        subject  = 'Tu pedido fue confirmado ✨',
        to_email = _get_recipient(order),
        template = 'order_confirmed.html',
        context  = _base_context(order),
    )


def send_order_scheduled(order):
    """Email 2: Informa la fecha de envío del ciclo asignado."""
    ctx = _base_context(order)
    cycle = order.shipping_cycle
    if cycle:
        months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre']
        ship_str = f'{cycle.ship_date.day} de {months[cycle.ship_date.month - 1]}'
        subject  = f'Tu pedido llegará el {ship_str} 📦'
    else:
        subject  = 'Fecha de entrega de tu pedido 📦'
    _send_async(
        subject  = subject,
        to_email = _get_recipient(order),
        template = 'order_scheduled.html',
        context  = ctx,
    )


def send_order_shipped(order):
    """Email 3: El pedido salió hoy."""
    _send_async(
        subject  = 'Hoy sale tu pedido rumbo a la costa 🚚',
        to_email = _get_recipient(order),
        template = 'order_shipped.html',
        context  = _base_context(order),
    )


def send_order_delivered(order):
    """Email 4: El pedido fue entregado."""
    _send_async(
        subject  = 'Tu pedido fue entregado ❤️',
        to_email = _get_recipient(order),
        template = 'order_delivered.html',
        context  = _base_context(order),
    )
