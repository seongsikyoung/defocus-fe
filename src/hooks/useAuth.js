import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useAuth() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore()

  useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: async () => {
      const res = await authApi.getMe()
      setUser(res.data)
      return res.data
    },
    enabled: isAuthenticated && !user,
    retry: false,
  })

  return { user, isAuthenticated, clearAuth }
}
