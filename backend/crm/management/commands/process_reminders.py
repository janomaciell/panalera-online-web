"""
Management command: procesa y envía recordatorios de recompra pendientes.

Uso:
  python manage.py process_reminders

Ideal para ejecutar via cron cada hora:
  0 * * * * cd /path/to/backend && python manage.py process_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from crm.models import RepurchaseReminder


class Command(BaseCommand):
    help = 'Envía recordatorios de recompra pendientes cuya fecha ya pasó.'

    def handle(self, *args, **options):
        now = timezone.now()
        pending = RepurchaseReminder.objects.filter(
            status='pending',
            scheduled_for__lte=now,
        ).select_related('user', 'product', 'origin_order')

        count = 0
        for reminder in pending:
            try:
                from services.email_service import send_repurchase_reminder
                send_repurchase_reminder(reminder)
                count += 1
                self.stdout.write(f'  ✓ Enviado: {reminder}')
            except Exception as e:
                self.stderr.write(f'  ✗ Error: {reminder} — {e}')

        self.stdout.write(self.style.SUCCESS(f'\n{count} recordatorios procesados.'))
