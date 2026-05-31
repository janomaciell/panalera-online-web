import { useQuery, useMutation } from '@tanstack/react-query'
import { orderService } from '@/services/orderService'

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.myOrders().then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data) => orderService.create(data).then(r => r.data),
  })
}

export function useDashboardOrders(params) {
  return useQuery({
    queryKey: ['dashboard-orders', params],
    queryFn: () => orderService.all(params).then(r => r.data.results !== undefined ? r.data.results : r.data),
    refetchInterval: 30000,
  })
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({ id, status, notes }) => orderService.updateStatus(id, status, notes).then(r => r.data),
  })
}
