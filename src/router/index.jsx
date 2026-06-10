import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { SignupPage } from '@/pages/Signup'
import { DashboardPage } from '@/pages/Dashboard'
import { RainfallPage } from '@/pages/Rainfall'
import { RiverPage } from '@/pages/River'
import { SewerPage } from '@/pages/Sewer'
import { AdminPage } from '@/pages/Admin'
import { NotFoundPage } from '@/pages/NotFound'
import { ROUTES } from '@/constants/routes'
import { RootRedirect } from './RootRedirect'
import { PrivateRoute } from './PrivateRoute'

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
    element: <PrivateRoute><DashboardPage /></PrivateRoute>,
  },
  {
    path: ROUTES.RAINFALL,
    element: <PrivateRoute><RainfallPage /></PrivateRoute>,
  },
  {
    path: ROUTES.RIVER,
    element: <PrivateRoute><RiverPage /></PrivateRoute>,
  },
  {
    path: ROUTES.SEWER,
    element: <PrivateRoute><SewerPage /></PrivateRoute>,
  },
  {
    path: ROUTES.ADMIN,
    element: <PrivateRoute><AdminPage /></PrivateRoute>,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
