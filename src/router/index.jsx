import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { HomePage } from '@/pages/Home'
import { LoginPage } from '@/pages/Login'
import { NotFoundPage } from '@/pages/NotFound'
import { ROUTES } from '@/constants/routes'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
