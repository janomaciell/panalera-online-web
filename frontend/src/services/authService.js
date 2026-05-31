import api from './api'

export const authService = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  me: () => api.get('/auth/me/'),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
}
