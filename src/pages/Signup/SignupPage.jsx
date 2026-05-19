import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { ROUTES } from '@/constants/routes'

export function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { confirmPassword: _, ...payload } = form
      await authApi.signup(payload)
      navigate(ROUTES.LOGIN, { replace: true, state: { signedUp: true } })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.defaultMessage ||
        '회원가입에 실패했습니다. 다시 시도해주세요.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'username',        label: '아이디',       type: 'text',     placeholder: '아이디를 입력하세요',       autoComplete: 'username' },
    { id: 'name',            label: '이름',         type: 'text',     placeholder: '이름을 입력하세요',         autoComplete: 'name' },
    { id: 'email',           label: '이메일',       type: 'email',    placeholder: '이메일을 입력하세요',       autoComplete: 'email' },
    { id: 'password',        label: '비밀번호',     type: 'password', placeholder: '비밀번호를 입력하세요',     autoComplete: 'new-password' },
    { id: 'confirmPassword', label: '비밀번호 확인', type: 'password', placeholder: '비밀번호를 다시 입력하세요', autoComplete: 'new-password' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eaeef3] px-4 py-16">
      <div className="flex w-full max-w-[480px] flex-col items-start rounded-[20px] bg-white px-8 py-[60px] shadow-[0px_2px_8px_0px_rgba(29,65,132,0.05),0px_8px_32px_0px_rgba(29,65,132,0.1)] sm:px-[52px]">

        {/* Header */}
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex size-[68px] items-center justify-center rounded-full bg-[#3b7df6]">
            <span className="text-[28px] font-bold text-white">D</span>
          </div>
          <p className="text-[22px] font-bold text-[#1d4184] sm:text-[24px]">강수 모니터링 서비스</p>
          <p className="text-sm text-[#75869b]">새 계정을 만드세요</p>
        </div>

        <div className="h-8 w-full shrink-0" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-4">
            {fields.map(({ id, label, type, placeholder, autoComplete }) => (
              <div key={id} className="flex flex-col gap-2">
                <label htmlFor={id} className="text-[13px] font-medium text-[#48596d]">
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  name={id}
                  value={form[id]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required
                  className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#ced4db] bg-[#f7f8fa] px-4 text-sm text-[#1d4184] placeholder:text-[#a8b5c2] outline-none transition-colors focus:border-[#3b7df6]"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-[rgba(243,66,54,0.08)] px-4 py-2.5 text-[13px] text-[#f34236]">
              {error}
            </p>
          )}

          <div className="h-[40px] w-full shrink-0" />

          <button
            type="submit"
            disabled={loading}
            className="h-[52px] w-full rounded-[12px] bg-[#3b7df6] text-base font-semibold text-white shadow-[0px_4px_16px_0px_rgba(39,95,229,0.32)] transition-colors hover:bg-[#3069e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="h-6 w-full shrink-0" />

        <div className="flex w-full items-center gap-[14px]">
          <div className="h-px flex-1 bg-[#e0e5ea]" />
          <span className="text-[12px] text-[#a6b3c1]">또는</span>
          <div className="h-px flex-1 bg-[#e0e5ea]" />
        </div>

        <div className="h-5 w-full shrink-0" />

        <div className="flex w-full items-center justify-center">
          <span className="text-[13px] text-[#75869b]">이미 계정이 있으신가요?</span>
          <Link
            to={ROUTES.LOGIN}
            className="ml-2 text-[13px] font-medium text-[#3b7df6] hover:underline"
          >
            로그인 →
          </Link>
        </div>
      </div>
    </div>
  )
}
