import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

export default function ProtectedRoute({ children, staffOnly = false }) {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (staffOnly && !user?.is_staff) return <Navigate to="/" replace />
  return children
}
