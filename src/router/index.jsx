import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { SignupPage } from '@/pages/Signup'
import { DashboardPage } from '@/pages/Dashboard'
import { RainfallPage } from '@/pages/Rainfall'
import { RiverPage } from '@/pages/River'
import { SewerPage } from '@/pages/Sewer'
import { NotFoundPage } from '@/pages/NotFound'
import { ROUTES } from '@/constants/routes'
import { RootRedirect } from './RootRedirect'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
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
    path: ROUTES.RIVER,
    element: <RiverPage />,
  },
  {
    path: ROUTES.SEWER,
    element: <SewerPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
