import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: authApi.login(form)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eaeef3]">
      <div className="flex w-[480px] flex-col items-start rounded-[20px] bg-white p-[52px] shadow-[0px_2px_8px_0px_rgba(29,65,132,0.05),0px_8px_32px_0px_rgba(29,65,132,0.1)]">

        {/* Header */}
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex size-[68px] items-center justify-center rounded-full bg-[#3b7df6]">
            <span className="text-[28px] font-bold text-white">D</span>
          </div>
          <p className="text-[24px] font-bold text-[#1d4184]">강수 모니터링 서비스</p>
          <p className="text-sm text-[#75869b]">계정에 로그인하세요</p>
        </div>

        <div className="h-9 w-full shrink-0" />

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
                className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#ced4db] bg-[#f7f8fa] px-4 text-sm text-[#1d4184] placeholder:text-[#a8b5c2] outline-none transition-colors focus:border-[#3b7df6]"
              />
            </div>
          </div>

          <div className="h-[44px] w-full shrink-0" />

          <button
            type="submit"
            className="h-[52px] w-full rounded-[12px] bg-[#3b7df6] text-base font-semibold text-white shadow-[0px_4px_16px_0px_rgba(39,95,229,0.32)] transition-colors hover:bg-[#3069e0]"
          >
            로그인
          </button>
        </form>

        <div className="h-6 w-full shrink-0" />

        {/* Divider */}
        <div className="flex w-full items-center gap-[14px]">
          <div className="h-px flex-1 bg-[#e0e5ea]" />
          <span className="text-[12px] text-[#a6b3c1]">또는</span>
          <div className="h-px flex-1 bg-[#e0e5ea]" />
        </div>

        <div className="h-5 w-full shrink-0" />

        {/* Links */}
        <div className="flex w-full items-center">
          <Link to="#" className="text-[13px] text-[#3b7df6] hover:underline">
            아이디 찾기
          </Link>
          <span className="mx-[5px] text-[13px] text-[#bfc8d2]">|</span>
          <Link to="#" className="text-[13px] text-[#3b7df6] hover:underline">
            비밀번호 찾기
          </Link>
          <div className="flex-1" />
          <Link
            to={ROUTES.SIGNUP}
            className="text-[13px] font-medium text-[#3b7df6] hover:underline"
          >
            회원가입 →
          </Link>
        </div>
      </div>
    </div>
  )
}
