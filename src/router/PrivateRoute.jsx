import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'

export function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#edf0f4] dark:bg-[#0f1729]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3b82f6] border-t-transparent" />
    </div>
  )

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />

  return children
}
