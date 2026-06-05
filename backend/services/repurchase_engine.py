"""
Motor de predicción de recompra.

Lógica:
  1. Obtener historial de compras del usuario para el producto.
  2. Si no hay historial (cold start): usar default_daily_units del producto.
  3. Con historial: calcular consumo diario real y predecir próxima compra.
  4. Programar recordatorios (reminder, promo, reorder, review).
"""
import logging
import secrets
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


class RepurchaseEngine:

    # ── Punto de entrada principal ────────────────────────────────────────────

    def process_order(self, order):
        """
        Analiza un pedido recién pagado y programa los recordatorios de recompra
        para cada producto con motor predictivo.
        """
        from crm.models import RepurchaseReminder, ConsumptionProfile

        if not order.user:
            logger.info(f'[CRM] Pedido {order.id} es guest — sin recordatorios automáticos.')
            return

        for item in order.items.select_related('product').all():
            try:
                prediction = self.predict(order.user, item.product)
                if not prediction:
                    continue
                self._schedule_reminders(order, item, prediction)
            except Exception as e:
                logger.error(f'[CRM] Error procesando recompra para item {item.id}: {e}')

    # ── Predicción ────────────────────────────────────────────────────────────

    def predict(self, user, product) -> dict | None:
        """
        Calcula la fecha estimada de próxima compra.

        Returns dict with keys:
            estimated_end_date, reminder_date, promo_date, reorder_date,
            review_date, daily_units, duration_days, confidence
        """
        from orders.models import OrderItem

        history = list(
            OrderItem.objects.filter(
                order__user=user,
                product=product,
                order__payment_status='approved',
            ).select_related('order', 'product').order_by('order__created_at')
        )

        if not history:
            # Sin historial previo — usamos el default del producto
            daily_units = product.default_daily_units
            if not daily_units:
                logger.info(f'[CRM] Producto {product.title} sin default_daily_units — omitiendo predicción.')
                return None
            confidence = 'low'
            method = 'cold_start'
        elif len(history) == 1:
            # Solo la compra actual — usamos default pero con confianza media
            daily_units = self._get_profile_units(user, product) or product.default_daily_units or 4
            confidence = 'medium'
            method = 'single_purchase'
        else:
            # Historial suficiente — calcular intervalo real
            daily_units, confidence = self._calculate_from_history(history, user, product)
            method = 'historical'

        last_item = history[-1] if history else None
        last_order_date = last_item.order.created_at if last_item else timezone.now()

        # Unidades físicas compradas en este pedido
        total_units = sum(i.total_units for i in history[-1:]) if history else 0
        if total_units == 0:
            total_units = product.quantity or 20

        duration_days = total_units / daily_units
        now = timezone.now()
        estimated_end = last_order_date + timedelta(days=duration_days)

        return {
            'estimated_end_date': estimated_end,
            'reminder_date':      estimated_end - timedelta(days=2),
            'promo_date':         estimated_end - timedelta(days=1),
            'reorder_date':       estimated_end,
            'review_date':        last_order_date + timedelta(days=3),
            'daily_units':        daily_units,
            'duration_days':      duration_days,
            'confidence':         confidence,
            'method':             method,
        }

    # ── Helpers internos ──────────────────────────────────────────────────────

    def _get_profile_units(self, user, product) -> float | None:
        """Lee el perfil de consumo guardado del usuario."""
        from crm.models import ConsumptionProfile
        try:
            profile = ConsumptionProfile.objects.get(user=user, product=product)
            return profile.daily_units
        except ConsumptionProfile.DoesNotExist:
            return None

    def _calculate_from_history(self, history, user, product):
        """Calcula consumo diario promedio a partir del historial de compras."""
        if len(history) < 2:
            return product.default_daily_units or 4, 'medium'

        # Calcular intervalos entre compras
        intervals = []
        for i in range(1, len(history)):
            delta = (history[i].order.created_at - history[i-1].order.created_at).days
            if delta > 0:
                intervals.append(delta)

        if not intervals:
            return product.default_daily_units or 4, 'medium'

        avg_interval = sum(intervals) / len(intervals)

        # Unidades promedio compradas en cada pedido
        avg_units = sum(item.total_units for item in history) / len(history)
        daily_units = avg_units / avg_interval if avg_interval > 0 else 4

        confidence = 'high' if len(history) >= 3 else 'medium'
        return max(daily_units, 0.5), confidence

    def _schedule_reminders(self, order, item, prediction):
        """Programa los 4 recordatorios: reminder, promo, reorder, review."""
        from crm.models import RepurchaseReminder

        now = timezone.now()

        reminders_to_create = [
            {
                'type':          'reminder',
                'scheduled_for': prediction['reminder_date'],
            },
            {
                'type':          'promo',
                'scheduled_for': prediction['promo_date'],
                'promo_code':    self._generate_promo_code(order.user, item.product),
                'discount_pct':  10,
            },
            {
                'type':          'reorder',
                'scheduled_for': prediction['reorder_date'],
            },
            {
                'type':          'review',
                'scheduled_for': prediction['review_date'],
            },
        ]

        created = 0
        for r_data in reminders_to_create:
            scheduled = r_data['scheduled_for']
            if scheduled <= now:
                # Si la fecha ya pasó, programar para mañana
                scheduled = now + timedelta(days=1)
                r_data['scheduled_for'] = scheduled

            # Evitar duplicados: si ya existe un reminder del mismo tipo para este pedido+producto
            exists = RepurchaseReminder.objects.filter(
                user=order.user,
                product=item.product,
                origin_order=order,
                type=r_data['type'],
            ).exists()
            if exists:
                continue

            reminder = RepurchaseReminder.objects.create(
                user=order.user,
                product=item.product,
                origin_order=order,
                **r_data,
            )

            # Si hay cupón de descuento, crear el objeto Coupon
            if r_data.get('promo_code') and r_data.get('discount_pct'):
                self._create_promo_coupon(
                    code=r_data['promo_code'],
                    user=order.user,
                    discount_pct=r_data['discount_pct'],
                    valid_from=r_data['scheduled_for'],
                    valid_until=r_data['scheduled_for'] + timedelta(days=7),
                )
                reminder.promo_code = r_data['promo_code']
                reminder.save(update_fields=['promo_code'])

            created += 1

        logger.info(f'[CRM] Programados {created} recordatorios para user={order.user.id} product={item.product.id}')

    def _generate_promo_code(self, user, product) -> str:
        """Genera un código único de promoción."""
        prefix = 'VUELTA'
        suffix = secrets.token_hex(3).upper()
        return f'{prefix}-{suffix}'

    def _create_promo_coupon(self, code, user, discount_pct, valid_from, valid_until):
        """Crea el objeto Coupon asociado al recordatorio."""
        from crm.models import Coupon
        Coupon.objects.get_or_create(
            code=code,
            defaults={
                'description':    f'Descuento de recompra automático',
                'discount_type':  'percentage',
                'discount_value': discount_pct,
                'user':           user,
                'valid_from':     valid_from,
                'valid_until':    valid_until,
                'max_uses':       1,
                'is_active':      True,
            }
        )


# Singleton
repurchase_engine = RepurchaseEngine()
