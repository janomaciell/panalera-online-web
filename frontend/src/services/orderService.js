import api from './api'

export const orderService = {
  create: (data) => api.post('/orders/', data),
  myOrders: () => api.get('/orders/me/'),
  detail: (id) => api.get(`/orders/${id}/`),
  // dashboard
  all: (params) => api.get('/dashboard/orders/', { params }),
  updateStatus: (id, status, notes) => api.patch(`/dashboard/orders/${id}/status/`, { status, notes }),
}
