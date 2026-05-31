import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.list(params).then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.detail(slug).then(r => r.data),
    enabled: !!slug,
  })
}
