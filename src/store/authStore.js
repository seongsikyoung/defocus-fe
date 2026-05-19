import { create } from 'zustand'
import { authApi } from '@/api/auth'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
  checkAuth: async () => {
    try {
      const user = await authApi.getMe()
      set({ user, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
