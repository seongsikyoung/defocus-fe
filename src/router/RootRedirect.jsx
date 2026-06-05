import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return null

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}
