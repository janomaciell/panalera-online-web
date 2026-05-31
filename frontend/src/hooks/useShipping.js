import { useQuery, useMutation } from '@tanstack/react-query'
import { shippingService } from '@/services/shippingService'

export function useShippingZones() {
  return useQuery({
    queryKey: ['shipping-zones'],
    queryFn: () => shippingService.zones().then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
}

export function useNextCycle() {
  return useQuery({
    queryKey: ['next-cycle'],
    queryFn: () => shippingService.nextCycle().then(r => r.data),
    staleTime: 1000 * 60 * 30,
  })
}

export function useCalculateShipping() {
  return useMutation({
    mutationFn: ({ city, postal_code }) => shippingService.calculate(city, postal_code).then(r => r.data),
  })
}
