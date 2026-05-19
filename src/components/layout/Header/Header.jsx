import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link to={ROUTES.HOME} className="text-lg font-semibold text-gray-900">
          defocus
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to={ROUTES.LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            로그인
          </Link>
        </nav>
      </div>
    </header>
  )
}
