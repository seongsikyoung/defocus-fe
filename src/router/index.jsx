import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { HomePage } from '@/pages/Home'
import { LoginPage } from '@/pages/Login'
import { SignupPage } from '@/pages/Signup'
import { DashboardPage } from '@/pages/Dashboard'
import { RainfallPage } from '@/pages/Rainfall'
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
    path: ROUTES.SIGNUP,
    element: <SignupPage />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
  },
  {
    path: ROUTES.RAINFALL,
    element: <RainfallPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
