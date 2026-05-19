import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { HomePage } from '@/pages/Home'
import { NotFoundPage } from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
