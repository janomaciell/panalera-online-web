import api from './api'

export const shippingService = {
  zones: () => api.get('/shipping/zones/'),
  calculate: (city, postal_code) => api.post('/shipping/calculate/', { city, postal_code }),
  nextCycle: () => api.get('/shipping/next-cycle/'),
  // dashboard
  createZone: (data) => api.post('/dashboard/shipping-zones/', data),
  updateZone: (id, data) => api.patch(`/dashboard/shipping-zones/${id}/`, data),
  deleteZone: (id) => api.delete(`/dashboard/shipping-zones/${id}/`),
  allZones: () => api.get('/dashboard/shipping-zones/'),
}
