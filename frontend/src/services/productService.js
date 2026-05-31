import api from './api'

export const productService = {
  list: (params = {}) => api.get('/products/', { params: { page_size: 1000, ...params } }),
  detail: (slug) => api.get(`/products/${slug}/`),
  // dashboard
  create: (data) => api.post('/dashboard/products/', data),
  update: (id, data) => api.patch(`/dashboard/products/${id}/`, data),
  delete: (id) => api.delete(`/dashboard/products/${id}/`),
  dashboardList: () => api.get('/dashboard/products/'),
}
