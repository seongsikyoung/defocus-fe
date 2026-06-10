import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { dashboardApi } from '@/api/dashboard'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useClock } from '@/hooks/useClock'

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황',    route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황',    route: ROUTES.RAINFALL  },
  { label: '수위', sub: '하천·하수관', route: ROUTES.RIVER     },
]

function NavIcon({ route, active }) {
  const c = active ? '#3b82f6' : '#94a3b8'
  if (route === ROUTES.DASHBOARD) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2"    y="11" width="3.5" height="7"  rx="1" fill={c}/>
      <rect x="8.25" y="7"  width="3.5" height="11" rx="1" fill={c}/>
      <rect x="14.5" y="3"  width="3.5" height="15" rx="1" fill={c}/>
    </svg>
  )
  if (route === ROUTES.RAINFALL) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14 8.5a3.5 3.5 0 0 0-3.5-3.5 3.5 3.5 0 0 0-3.36 2.5H6.5a2 2 0 0 0 0 4h7a2 2 0 0 0 0-4H13" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 15L6 16.5M10 15L9.5 16.5M13.5 15L13 16.5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
  if (route === ROUTES.RIVER) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M1 7.5Q3.5 5 5.5 7.5Q7.5 10 9.5 7.5Q11.5 5 13.5 7.5Q15.5 10 17.5 7.5Q19 5.5 21 7.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M1 12.5Q3.5 10 5.5 12.5Q7.5 15 9.5 12.5Q11.5 10 13.5 12.5Q15.5 15 17.5 12.5Q19 10.5 21 12.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  return null
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="#94a3b8" strokeWidth="1.4"/>
      <path d="M10 2.5v1.5M10 16v1.5M2.5 10H4M16 10h1.5M4.4 4.4l1.1 1.1M14.5 14.5l1.1 1.1M4.4 15.6l1.1-1.1M14.5 5.5l1.1-1.1" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function DashboardLayout({
  children,
  activeRoute,
  alertCount = 0,
  outerBg = 'bg-[#edf0f4]',
  fullHeight = true,
  onTabReclick,
}) {
  const navigate = useNavigate()
  const now = useClock()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 캐시에서만 읽음 — 직접 fetch 하지 않고 DashboardPage가 갱신할 때 반응
  const { data: dashboardCache } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.SUMMARY,
    queryFn: dashboardApi.getSummary,
    select: (res) => res.data,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })
  const headerAlertCount = dashboardCache?.recentAlerts?.length ?? 0

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false })
  const heightCls = fullHeight ? 'h-screen overflow-hidden' : 'md:h-screen md:overflow-hidden'

  return (
    <div className={`flex flex-col ${heightCls} ${outerBg} dark:bg-[#0f1729]`}>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* ── Header ── */}
      <header className="grid h-14 shrink-0 grid-cols-[52px_1fr_auto] md:grid-cols-[84px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] dark:bg-[#1a2744] dark:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-center">
          <div className="flex size-[30px] items-center justify-center rounded-full bg-[#3b82f6]">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </div>
        <p className="truncate px-2 text-center text-[12px] font-bold text-[#1e293b] dark:text-[#e2e8f0] sm:text-[15px]">
          실시간 강수 재난안전 통합 모니터링 시스템
        </p>
        <div className="flex items-center gap-2 pr-3 sm:gap-3 sm:pr-5">
          <div className="flex items-center gap-1 rounded-full border border-[#e53333] bg-[#ffe5e5] px-2 py-1 sm:gap-1.5 sm:px-3">
            <span className="size-[7px] rounded-full bg-[#e53333]" />
            <span className="text-[10px] font-medium text-[#cc1a1a] sm:text-[11px]">경보 {headerAlertCount}건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] dark:text-[#94a3b8] sm:block">{timeStr}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">

        {/* ── Left Nav — md 이상에서만 표시 ── */}
        <nav className="relative hidden md:flex w-[84px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white dark:border-[#2d3f5e] dark:bg-[#1a2744]">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.route === activeRoute
              return (
                <div
                  key={item.label}
                  onClick={() => active ? onTabReclick?.() : navigate(item.route)}
                  className={`relative flex w-full cursor-pointer flex-col items-center py-3 md:py-4 ${
                    active
                      ? 'bg-[rgba(185,217,254,0.4)] dark:bg-[rgba(59,130,246,0.2)]'
                      : 'hover:bg-[#f1f5f9] dark:hover:bg-[#243352]'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-[#3b82f6]" />
                  )}
                  <span className={`text-[13px] md:text-[14px] ${active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#64748b] dark:text-[#94a3b8]'}`}>
                    {item.label}
                  </span>
                  <span className={`text-[8px] md:text-[9px] ${active ? 'text-[#3b82f6]' : 'text-[#64748b] dark:text-[#94a3b8]'}`}>
                    {item.sub}
                  </span>
                </div>
              )
            })}
          </div>
          <div
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 flex w-full cursor-pointer flex-col items-center border-t border-[#e2e8f0] py-3 hover:bg-[#f1f5f9] dark:border-[#2d3f5e] dark:hover:bg-[#243352] md:py-4"
          >
            <span className="text-[13px] font-medium text-[#64748b] dark:text-[#94a3b8] md:text-[14px]">설정</span>
            <span className="text-[8px] text-[#64748b] dark:text-[#94a3b8] md:text-[9px]">설정</span>
          </div>
        </nav>

        {/* ── Page Content ── */}
        {children}
      </div>

      {/* ── Mobile Bottom Nav — md 미만에서만 표시 (fixed) ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex h-14 items-center justify-around border-t border-[#e2e8f0] bg-white md:hidden dark:border-[#2d3f5e] dark:bg-[#1a2744]">
        {NAV_ITEMS.map((item) => {
          const active = item.route === activeRoute
          return (
            <button
              key={item.label}
              onClick={() => active ? onTabReclick?.() : navigate(item.route)}
              className="flex flex-1 flex-col items-center gap-[3px] py-2"
            >
              <NavIcon route={item.route} active={active} />
              <span className={`text-[10px] ${active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#94a3b8]'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex flex-1 flex-col items-center gap-[3px] py-2"
        >
          <SettingsIcon />
          <span className="text-[10px] font-medium text-[#94a3b8]">설정</span>
        </button>
      </nav>
    </div>
  )
}
