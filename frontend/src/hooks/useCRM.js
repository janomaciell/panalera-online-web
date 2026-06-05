import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crmService } from '@/services/crmService'

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, subtotal }) => crmService.validateCoupon(code, subtotal).then(r => r.data),
  })
}

export function useSaveConsumptionProfile() {
  return useMutation({
    mutationFn: ({ productId, dailyUnits, source }) =>
      crmService.saveConsumptionProfile(productId, dailyUnits, source).then(r => r.data),
  })
}

export function useReorderItems(orderId) {
  return useQuery({
    queryKey: ['reorder', orderId],
    queryFn: () => crmService.getReorderItems(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
  })
}
