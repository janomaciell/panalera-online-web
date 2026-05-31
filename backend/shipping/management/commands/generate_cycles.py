import calendar
from datetime import date
from django.core.management.base import BaseCommand
from shipping.models import ShippingCycle


class Command(BaseCommand):
    help = 'Genera ciclos de envío (día 1 y 15) para los próximos N meses'

    def add_arguments(self, parser):
        parser.add_argument('--months', type=int, default=3, help='Número de meses a generar')

    def handle(self, *args, **options):
        months_ahead = options['months']
        today        = date.today()
        created      = 0
        skipped      = 0

        for i in range(months_ahead):
            # Calculate target year/month
            target_month = (today.month - 1 + i) % 12 + 1
            target_year  = today.year + (today.month - 1 + i) // 12

            # ── Cycle day 1 ──────────────────────────────────────
            ship_1 = date(target_year, target_month, 1)
            # Cutoff = last day of previous month
            prev_month = 12 if target_month == 1 else target_month - 1
            prev_year  = target_year - 1 if target_month == 1 else target_year
            last_day   = calendar.monthrange(prev_year, prev_month)[1]
            cutoff_1   = date(prev_year, prev_month, last_day)

            _, was_created = ShippingCycle.objects.get_or_create(
                ship_date=ship_1,
                defaults={'cutoff_date': cutoff_1, 'cycle_day': 1},
            )
            if was_created:
                created += 1
                self.stdout.write(f'  ✓ Creado: envío {ship_1} / cierre {cutoff_1}')
            else:
                skipped += 1

            # ── Cycle day 15 ─────────────────────────────────────
            ship_15   = date(target_year, target_month, 15)
            cutoff_15 = date(target_year, target_month, 14)

            _, was_created = ShippingCycle.objects.get_or_create(
                ship_date=ship_15,
                defaults={'cutoff_date': cutoff_15, 'cycle_day': 15},
            )
            if was_created:
                created += 1
                self.stdout.write(f'  ✓ Creado: envío {ship_15} / cierre {cutoff_15}')
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'\n{created} ciclos creados, {skipped} ya existían.'
        ))
