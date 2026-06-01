import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authApi } from '@/api/auth'
import { ROUTES } from '@/constants/routes'

export function SettingsPanel({ onClose }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate(ROUTES.LOGIN)
  }

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 z-[210] flex w-[300px] flex-col bg-white shadow-[4px_0_24px_0_rgba(0,0,0,0.12)] dark:bg-[#1a2744]">

        {/* Header — always visible */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8f0] px-5 dark:border-[#2d3f5e]">
          <span className="text-[14px] font-semibold text-[#1e293b] dark:text-[#e2e8f0]">설정</span>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#243352]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable area — content + logout */}
        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* Content */}
          <div className="flex flex-col gap-5 p-5">

            {/* Profile Card */}
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-6 dark:border-[#2d3f5e] dark:bg-[#111d35]">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#3b82f6]">
                <span className="text-[18px] font-bold text-white">{initials}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[15px] font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
                  {user?.name ?? '-'}
                </span>
                <span className="text-[12px] text-[#64748b] dark:text-[#94a3b8]">
                  @{user?.username ?? '-'}
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col gap-1 rounded-xl border border-[#e2e8f0] bg-white overflow-hidden dark:border-[#2d3f5e] dark:bg-[#1e2d45]">
              <div className="px-4 py-3 border-b border-[#f1f5f9] dark:border-[#2d3f5e]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">프로필 정보</span>
              </div>
              {[
                { label: '이름',   value: user?.name },
                { label: '아이디', value: user?.username },
                { label: '이메일', value: user?.email },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9] last:border-0 dark:border-[#2d3f5e]">
                  <span className="text-[12px] text-[#64748b] dark:text-[#94a3b8]">{label}</span>
                  <span className="text-[13px] font-medium text-[#1e293b] dark:text-[#e2e8f0] max-w-[160px] truncate text-right">
                    {value ?? '-'}
                  </span>
                </div>
              ))}
            </div>

            {/* Theme Toggle */}
            <div className="flex flex-col gap-1 rounded-xl border border-[#e2e8f0] bg-white overflow-hidden dark:border-[#2d3f5e] dark:bg-[#1e2d45]">
              <div className="px-4 py-3 border-b border-[#f1f5f9] dark:border-[#2d3f5e]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">화면 모드</span>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[18px]">{isDark ? '🌙' : '☀️'}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-[#1e293b] dark:text-[#e2e8f0]">
                      {isDark ? '다크 모드' : '라이트 모드'}
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">
                      {isDark ? '어두운 배경' : '밝은 배경'}
                    </span>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={toggleTheme}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                    isDark ? 'bg-[#3b82f6]' : 'bg-[#cbd5e1]'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isDark ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

          </div>

          {/* Logout — inside scroll so it doesn't eat into content space */}
          <div className="border-t border-[#e2e8f0] p-5 dark:border-[#2d3f5e]">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#fecdd3] bg-[#fff1f2] py-3 text-[13px] font-semibold text-[#e53333] transition-colors hover:bg-[#ffe4e6] dark:border-[#5c1d25] dark:bg-[#2d1219] dark:text-[#f87171] dark:hover:bg-[#3d1820]"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6M10 10.5l3-3-3-3M13 7.5H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              로그아웃
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
