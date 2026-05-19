import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-32">
      <span className="text-6xl font-bold text-gray-200">404</span>
      <p className="text-gray-500">페이지를 찾을 수 없어요.</p>
      <Link
        to={ROUTES.HOME}
        className="text-sm text-blue-600 underline underline-offset-2"
      >
        홈으로 돌아가기
      </Link>
    </section>
  )
}
