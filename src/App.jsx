import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDark])

  return <RouterProvider router={router} />
}
