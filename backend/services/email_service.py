"""
Email service — envío asincrónico via django-q (con fallback a threading).
Todos los correos se despachan en background para no bloquear el request.

Si django-q no está disponible, cae a threading.Thread (comportamiento anterior).
"""
import threading
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_recipient(order) -> str:
    """Returns the best available email for this order."""
    if order.user and order.user.email:
        return order.user.email
    return order.guest_email or ''


def _strip_tags(html: str) -> str:
    """Naive HTML strip for plain-text fallback."""
    import re
    return re.sub(r'<[^>]+>', '', html).strip()


def _send_email_task(subject: str, to_email: str, template: str, context: dict):
    """
    Función ejecutada por django-q (o threading como fallback).
    Renderiza la plantilla y envía el correo.
    """
    if not to_email:
        logger.warning(f'[EMAIL] No recipient for template {template}. Skipping.')
        return
    try:
        html_content = render_to_string(template, context)
        msg = EmailMultiAlternatives(
            subject    = subject,
            body       = _strip_tags(html_content),
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [to_email],
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)
        logger.info(f'[EMAIL] Sent "{subject}" to {to_email}')
    except Exception as e:
        logger.error(f'[EMAIL] Failed to send "{subject}" to {to_email}: {e}')
        raise  # django-q puede reintentar si está configurado


def _send_async(subject: str, to_email: str, template: str, context: dict):
    """Envía un email en background (django-q preferido, threading como fallback)."""
    if not to_email:
        return
    try:
        from django_q.tasks import async_task
        async_task(
            'services.email_service._send_email_task',
            subject, to_email, template, context,
        )
        logger.debug(f'[EMAIL] Queued via django-q: "{subject}" → {to_email}')
    except ImportError:
        # Fallback: threading (sin reintentos)
        t = threading.Thread(
            target=_send_email_task,
            args=(subject, to_email, template, context),
            daemon=True,
        )
        t.start()
        logger.debug(f'[EMAIL] Queued via threading: "{subject}" → {to_email}')


def _base_context(order) -> dict:
    """Context shared by all email templates."""
    cycle = order.shipping_cycle
    return {
        'order':          order,
        'customer_name':  order.shipping_name.split()[0] if order.shipping_name else 'cliente',
        'order_id':       str(order.id)[:8].upper(),
        'items':          order.items.select_related('product').all(),
        'total':          order.total,
        'shipping_price': order.shipping_price,
        'is_pickup':      order.is_pickup,
        'shipping_city':  order.shipping_city,
        'ship_date':      cycle.ship_date if cycle else None,
        'cutoff_date':    cycle.cutoff_date if cycle else None,
        'frontend_url':   settings.FRONTEND_URL,
    }


# ── Transactional emails ──────────────────────────────────────────────────────

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
    ctx   = _base_context(order)
    cycle = order.shipping_cycle
    if cycle:
        months   = ['enero','febrero','marzo','abril','mayo','junio',
                    'julio','agosto','septiembre','octubre','noviembre','diciembre']
        ship_str = f'{cycle.ship_date.day} de {months[cycle.ship_date.month - 1]}'
        subject  = f'Tu pedido llegará el {ship_str} 📦'
    else:
        subject = 'Fecha de entrega de tu pedido 📦'
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


# ── CRM / Repurchase emails ───────────────────────────────────────────────────

def send_repurchase_reminder(reminder):
    """
    Envía el email de recordatorio de recompra según el tipo del reminder.
    """
    from crm.models import RepurchaseReminder
    from django.utils import timezone

    user    = reminder.user
    product = reminder.product

    to_email = user.email
    if not to_email:
        return

    context = {
        'customer_name':  user.name.split()[0] if user.name else 'cliente',
        'product':        product,
        'promo_code':     reminder.promo_code,
        'discount_pct':   reminder.discount_pct,
        'frontend_url':   settings.FRONTEND_URL,
        'product_url':    f'{settings.FRONTEND_URL}/productos/{product.slug}',
        'reorder_url':    f'{settings.FRONTEND_URL}/recompra/{reminder.origin_order_id}',
    }

    if reminder.type == 'reminder':
        subject  = f'Tu stock de {product.title} podría estar terminándose 📦'
        template = 'repurchase_reminder.html'
    elif reminder.type == 'promo':
        subject  = f'10% OFF en tu próxima compra de {product.title} ⚡'
        template = 'repurchase_promo.html'
    elif reminder.type == 'reorder':
        subject  = f'¿Te quedaste sin {product.title}? Reordenalo con 1 click 🛒'
        template = 'repurchase_reorder.html'
    elif reminder.type == 'review':
        subject  = f'¿Cómo te fue con {product.title}? Dejá tu reseña ⭐'
        template = 'repurchase_review.html'
    else:
        return

    _send_async(subject=subject, to_email=to_email, template=template, context=context)

    # Marcar como enviado
    reminder.status  = 'sent'
    reminder.sent_at = timezone.now()
    reminder.save(update_fields=['status', 'sent_at'])


def send_tracking_update(order, tracking_number: str, andreani_status: str):
    """Email de actualización de estado del envío Andreani."""
    to_email = _get_recipient(order)
    if not to_email:
        return
    ctx = _base_context(order)
    ctx.update({
        'tracking_number': tracking_number,
        'andreani_status': andreani_status,
        'tracking_url':    f'https://www.andreani.com/#!/informacionEnvio/{tracking_number}',
    })
    _send_async(
        subject  = f'Actualización de tu envío 📍 ({andreani_status})',
        to_email = to_email,
        template = 'order_tracking_update.html',
        context  = ctx,
    )
