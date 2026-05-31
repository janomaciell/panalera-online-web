from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
from .models import Order
from shipping.models import ShippingCycle


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today     = timezone.now().date()
        this_week = today - timedelta(days=7)

        total_orders    = Order.objects.filter(payment_status='approved').count()
        orders_week     = Order.objects.filter(payment_status='approved', created_at__date__gte=this_week).count()
        revenue_total   = Order.objects.filter(payment_status='approved').aggregate(t=Sum('total'))['t'] or 0
        revenue_week    = Order.objects.filter(payment_status='approved', created_at__date__gte=this_week).aggregate(t=Sum('total'))['t'] or 0
        pending_count   = Order.objects.filter(status='pending', payment_status='approved').count()
        shipping_today  = Order.objects.filter(status='shipping').count()

        # Orders by status
        by_status = list(
            Order.objects.filter(payment_status='approved')
            .values('status')
            .annotate(count=Count('id'))
        )

        # Next cycle
        cycle = ShippingCycle.get_next_open()

        return Response({
            'total_orders':   total_orders,
            'orders_week':    orders_week,
            'revenue_total':  float(revenue_total),
            'revenue_week':   float(revenue_week),
            'pending_count':  pending_count,
            'shipping_today': shipping_today,
            'by_status':      by_status,
            'next_cycle': {
                'ship_date':   str(cycle.ship_date)   if cycle else None,
                'cutoff_date': str(cycle.cutoff_date) if cycle else None,
                'orders':      cycle.orders_count     if cycle else 0,
            } if cycle else None,
        })
