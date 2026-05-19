import { Button } from '@/components/common/Button'

export function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24">
      <h1 className="text-4xl font-bold text-gray-900">defocus</h1>
      <p className="text-gray-500">React + Vite + Tailwind + Zustand</p>
      <Button>시작하기</Button>
    </section>
  )
}
