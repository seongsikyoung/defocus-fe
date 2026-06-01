import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useClock } from '@/hooks/useClock'

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황',    route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황',    route: ROUTES.RAINFALL  },
  { label: '수위', sub: '하천·하수관', route: ROUTES.RIVER     },
]

export function DashboardLayout({
  children,
  activeRoute,
  alertCount = 0,
  outerBg = 'bg-[#edf0f4]',
  fullHeight = true,
}) {
  const navigate = useNavigate()
  const now = useClock()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false })
  const heightCls = fullHeight ? 'h-screen overflow-hidden' : 'lg:h-screen lg:overflow-hidden'

  return (
    <div className={`flex flex-col ${heightCls} ${outerBg} dark:bg-[#0f1729]`}>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* ── Header ── */}
      <header className="grid h-14 shrink-0 grid-cols-[84px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] dark:bg-[#1a2744] dark:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-center">
          <div className="flex size-[30px] items-center justify-center rounded-full bg-[#3b82f6]">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </div>
        <p className="truncate px-2 text-center text-[13px] font-bold text-[#1e293b] dark:text-[#e2e8f0] sm:text-[15px]">
          실시간 강수 재난안전 통합 모니터링 시스템
        </p>
        <div className="flex items-center gap-2 pr-4 sm:gap-3 sm:pr-5">
          <div className="flex items-center gap-1.5 rounded-full border border-[#e53333] bg-[#ffe5e5] px-2.5 py-1 sm:px-3">
            <span className="size-[7px] rounded-full bg-[#e53333]" />
            <span className="text-[11px] font-medium text-[#cc1a1a]">경보 {alertCount}건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] dark:text-[#94a3b8] sm:block">{timeStr}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">

        {/* ── Left Nav ── */}
        <nav className="relative flex w-[84px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white dark:border-[#2d3f5e] dark:bg-[#1a2744]">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.route === activeRoute
              return (
                <div
                  key={item.label}
                  onClick={() => navigate(item.route)}
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
    </div>
  )
}
