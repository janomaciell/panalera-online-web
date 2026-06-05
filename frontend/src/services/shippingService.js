import api from './api'

export const shippingService = {
  zones:      () => api.get('/shipping/zones/'),
  calculate:  (data) => api.post('/shipping/calculate/', data),
  nextCycle:  () => api.get('/shipping/next-cycle/'),

  // Andreani quote by postal code
  andreaniQuote: ({ postalCode, weightG = 500, value = 0 }) =>
    api.get('/shipping/andreani/quote/', {
      params: { postal_code: postalCode, weight: weightG, value },
    }).then(r => r.data),
}
