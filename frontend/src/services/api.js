import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const stored = JSON.parse(localStorage.getItem('panalera-auth') || '{}')
  const token = stored?.state?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const stored = JSON.parse(localStorage.getItem('panalera-auth') || '{}')
        const refresh = stored?.state?.refreshToken
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
        const state = stored.state || {}
        state.token = data.access
        localStorage.setItem('panalera-auth', JSON.stringify({ ...stored, state }))
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('panalera-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
