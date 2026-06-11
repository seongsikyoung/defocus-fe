import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const signedUp = location.state?.signedUp ?? false

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.login(form)
      setUser({ username: form.username })
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.defaultMessage ||
        '아이디 또는 비밀번호를 확인해주세요.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eaeef3] px-4 py-16">
      <div className="flex w-full max-w-[480px] flex-col items-start rounded-[20px] bg-white px-8 py-[72px] shadow-[0px_2px_8px_0px_rgba(29,65,132,0.05),0px_8px_32px_0px_rgba(29,65,132,0.1)] sm:px-[52px]">

        {/* Header */}
        <div className="flex w-full flex-col items-center gap-3">
          <img src="/app-icon.svg" width={68} height={68} alt="강수 모니터링 로고" />
          <p className="text-[22px] font-bold text-[#1d4184] sm:text-[24px]">강수 모니터링 서비스</p>
        </div>

        <div className="h-11 w-full shrink-0" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-[13px] font-medium text-[#48596d]">
                아이디
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
                autoComplete="username"
                className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#ced4db] bg-[#f7f8fa] px-4 text-sm text-[#1d4184] placeholder:text-[#a8b5c2] outline-none transition-colors focus:border-[#3b7df6]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[13px] font-medium text-[#48596d]">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#ced4db] bg-[#f7f8fa] px-4 text-sm text-[#1d4184] placeholder:text-[#a8b5c2] outline-none transition-colors focus:border-[#3b7df6]"
              />
            </div>
          </div>

          {signedUp && (
            <p className="mt-4 rounded-lg bg-[rgba(34,197,94,0.10)] px-4 py-2.5 text-[13px] text-[#15803d]">
              회원가입이 완료되었습니다. 로그인해주세요.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-[rgba(243,66,54,0.08)] px-4 py-2.5 text-[13px] text-[#f34236]">
              {error}
            </p>
          )}

          <div className="h-[52px] w-full shrink-0" />

          <button
            type="submit"
            disabled={loading}
            className="h-[52px] w-full rounded-[12px] bg-[#3b7df6] text-base font-semibold text-white shadow-[0px_4px_16px_0px_rgba(39,95,229,0.32)] transition-colors hover:bg-[#3069e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="h-8 w-full shrink-0" />

        {/* Divider */}
        <div className="flex w-full items-center gap-[14px]">
          <div className="h-px flex-1 bg-[#e0e5ea]" />
          <span className="text-[12px] text-[#a6b3c1]">또는</span>
          <div className="h-px flex-1 bg-[#e0e5ea]" />
        </div>

        <div className="h-6 w-full shrink-0" />

        {/* Links */}
        <div className="flex w-full justify-end">
          <Link
            to={ROUTES.SIGNUP}
            className="text-[13px] font-medium text-[#3b7df6] hover:underline"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
