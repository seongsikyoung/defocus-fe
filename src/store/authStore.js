import { create } from 'zustand'
import { storage } from '@/utils/storage'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!storage.getToken(),

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearAuth: () => {
    storage.clearToken()
    set({ user: null, isAuthenticated: false })
  },
}))
