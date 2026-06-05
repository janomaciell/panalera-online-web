import api from './api'

export const crmService = {
  // Coupon validation
  validateCoupon: (code, subtotal) =>
    api.post('/crm/coupons/validate/', { code, subtotal }),

  // Save consumption profile (from onboarding questionnaire)
  saveConsumptionProfile: (productId, dailyUnits, source = 'onboarding') =>
    api.post('/crm/consumption-profile/', {
      product: productId,
      daily_units: dailyUnits,
      source,
    }),

  // Get reorder items for "buy again"
  getReorderItems: (orderId) =>
    api.get(`/crm/reorder/${orderId}/`).then(r => r.data),
}
