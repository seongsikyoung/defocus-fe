import { useEffect, useMemo, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useClock } from '@/hooks/useClock'
import { DASHBOARD_ALERTS, buildPoll } from '@/mocks/dashboard'

const IMG_AI_DOT   = 'https://www.figma.com/api/mcp/asset/7032a66f-9877-46e7-aff7-405516da4d1f'
const IMG_LIVE_DOT = 'https://www.figma.com/api/mcp/asset/2a20294d-966d-4e00-9b2a-5eaa3e021b05'

export function DashboardPage() {
  const now = useClock()
  const [poll, setPoll] = useState(() => buildPoll(null))

  // 10분 단위 폴링
  useEffect(() => {
    const run = () => setPoll(p => buildPoll(p))
    const id  = setInterval(run, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const pollTimeStr = poll.lastPoll
    ? poll.lastPoll.toLocaleTimeString('ko-KR', { hour12: false }).slice(0, 5)
    : '--:--'

  // 강수량 상태
  const rainfallStatus = poll.avgRainfall >= 30
    ? { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
    : poll.avgRainfall >= 10
    ? { label: '주의', bg: 'rgba(254,150,0,0.15)',   text: '#fe9600', border: 'rgba(254,150,0,0.25)',  accent: '#fe9600' }
    : { label: '정상', bg: 'rgba(30,135,229,0.15)',  text: '#1e87e5', border: 'rgba(30,135,229,0.25)', accent: '#1e87e5' }

  const riverStatus = poll.riverDanger >= 5
    ? { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
    : poll.riverDanger >= 2
    ? { label: '주의', bg: 'rgba(254,150,0,0.15)',  text: '#fe9600', border: 'rgba(254,150,0,0.25)',  accent: '#fe9600' }
    : { label: '정상', bg: 'rgba(36,197,82,0.15)',  text: '#24c552', border: 'rgba(36,197,82,0.25)',  accent: '#24c552' }

  const sewerStatus = poll.sewerDanger >= 3
    ? { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
    : { label: '정상', bg: 'rgba(36,197,82,0.15)',  text: '#24c552', border: 'rgba(36,197,82,0.25)',  accent: '#24c552' }

  // 차트 바
  const chartBars = useMemo(() => {
    const h    = now.getHours()
    const maxH = Math.max(...poll.history, 0.1)
    return poll.history.map((v, i) => {
      const hour   = (h - 5 + i + 24) % 24
      const isLast = i === poll.history.length - 1
      return {
        hour:   `${hour}시`,
        value:  v.toFixed(1),
        barH:   Math.round((v / maxH) * 120),
        active: isLast,
        color:  isLast ? '#1e87e5' : 'rgba(28,101,169,0.55)',
      }
    })
  }, [poll.history, now])

  const peakVal = Math.max(...poll.history).toFixed(1)

  return (
    <DashboardLayout
      activeRoute={ROUTES.DASHBOARD}
      alertCount={DASHBOARD_ALERTS.length}
    >
      <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:p-5 scrollbar-hide dark:bg-[#0f1729]">

        {/* ── Row 1: KPI Cards ── */}
        <div className="shrink-0 grid grid-cols-2 gap-4 xl:grid-cols-4">

          {/* 1. 서울 평균 강수량 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: rainfallStatus.border, animationDelay: '0ms' }}
          >
            <div className="h-[3px]" style={{ background: rainfallStatus.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium leading-tight text-[#66809b] dark:text-[#94a3b8] md:text-[12px]">
                  서울 평균 강수량
                </span>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: rainfallStatus.bg, color: rainfallStatus.text }}>
                  {rainfallStatus.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[30px] font-bold leading-none md:text-[34px]"
                  style={{ color: rainfallStatus.accent }}>
                  {poll.avgRainfall.toFixed(1)}
                </span>
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">mm/h</span>
              </div>
              <p className="text-[11px] text-[#97abc1]">AWS 89개 관측소 평균</p>
              <div className="flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: rainfallStatus.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위 · {pollTimeStr}</span>
              </div>
            </div>
          </div>

          {/* 2. 하천 위험 지점 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: riverStatus.border, animationDelay: '80ms' }}
          >
            <div className="h-[3px]" style={{ background: riverStatus.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium leading-tight text-[#66809b] dark:text-[#94a3b8] md:text-[12px]">
                  하천 위험 지점
                </span>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: riverStatus.bg, color: riverStatus.text }}>
                  {riverStatus.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[30px] font-bold leading-none md:text-[34px]"
                  style={{ color: riverStatus.accent }}>
                  {poll.riverDanger}
                </span>
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <p className="text-[11px] text-[#97abc1]">홍수주의 이상 발령</p>
              <div className="flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: riverStatus.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위 · {pollTimeStr}</span>
              </div>
            </div>
          </div>

          {/* 3. 하수관로 위험 지점 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: sewerStatus.border, animationDelay: '160ms' }}
          >
            <div className="h-[3px]" style={{ background: sewerStatus.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium leading-tight text-[#66809b] dark:text-[#94a3b8] md:text-[12px]">
                  하수관로 위험 지점
                </span>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: sewerStatus.bg, color: sewerStatus.text }}>
                  {sewerStatus.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[30px] font-bold leading-none md:text-[34px]"
                  style={{ color: sewerStatus.accent }}>
                  {poll.sewerDanger}
                </span>
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <p className="text-[11px] text-[#97abc1]">수위 70% 초과 관측소</p>
              <div className="flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: sewerStatus.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위 · {pollTimeStr}</span>
              </div>
            </div>
          </div>

          {/* 4. 전체 관측소 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: 'rgba(36,197,82,0.25)', animationDelay: '240ms' }}
          >
            <div className="h-[3px] bg-[#24c552]" />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium leading-tight text-[#66809b] dark:text-[#94a3b8] md:text-[12px]">
                  전체 관측소
                </span>
                <span className="shrink-0 rounded-[5px] bg-[rgba(36,197,82,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#24c552]">
                  운영 중
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[30px] font-bold leading-none text-[#24c552] md:text-[34px]">
                  {poll.stations.total}
                </span>
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: '정상', count: poll.stations.normal,  color: '#24c552', bg: 'rgba(36,197,82,0.1)',  pct: Math.round(poll.stations.normal  / poll.stations.total * 100) },
                  { label: '주의', count: poll.stations.caution, color: '#fe9600', bg: 'rgba(254,150,0,0.1)',  pct: Math.round(poll.stations.caution / poll.stations.total * 100) },
                  { label: '위험', count: poll.stations.danger,  color: '#f34236', bg: 'rgba(243,66,54,0.1)',  pct: Math.round(poll.stations.danger  / poll.stations.total * 100) },
                ].map(({ label, count, color, bg, pct }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-[10px] font-semibold" style={{ color }}>{label}</span>
                    <div className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: bg }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="w-5 shrink-0 text-right text-[10px] font-bold" style={{ color }}>{count}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-[#97abc1]">{pollTimeStr} 업데이트</span>
            </div>
          </div>
        </div>

        {/* ── Row 2: AI 분석 + 실시간 경보 ── */}
        <div className="shrink-0 grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* 5. AI 현 상황 분석 */}
          <div
            className="animate-slide-up flex flex-col gap-3 rounded-xl border border-[rgba(0,184,209,0.2)] bg-white px-6 py-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.08)] dark:bg-[#1e2d45] lg:col-span-3"
            style={{ animationDelay: '320ms' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={IMG_AI_DOT} alt="" className="size-[8px]" />
                <span className="text-[13px] font-semibold text-[#00b8d1]">AI 현 상황 분석</span>
              </div>
              <div className="flex items-center gap-1 rounded-[6px] border border-[rgba(219,226,234,0.5)] bg-white px-2.5 py-1 dark:border-[#2d3f5e] dark:bg-[#111d35]">
                <img src={IMG_LIVE_DOT} alt="" className="size-[6px]" />
                <span className="text-[11px] text-[#66809b] dark:text-[#94a3b8]">{pollTimeStr} 분석</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[rgba(243,66,54,0.25)] bg-[rgba(243,66,54,0.08)] px-4 py-2.5">
              <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">종합 위험도</span>
              <span className="rounded-[5px] bg-[rgba(243,66,54,0.2)] px-2 py-[3px] text-[10px] font-semibold text-[#f34236]">
                🔴&nbsp;&nbsp;높음 — Level 3
              </span>
            </div>
            <p className="text-[12px] leading-5 text-[#1b2c42] dark:text-[#c8d6e8]">
              중랑천 상류(망우 관측소) 수위가 급격히 상승 중이며, 현재 서울 평균 강수량({poll.avgRainfall.toFixed(1)} mm/h) 지속 시 약 1.5시간 내 홍수경보 기준(5.0m) 초과가 예상됩니다. 소양강댐 방류(320 m³/s)로 한강 하류 연쇄 상승이 우려되며, 강남구 역삼·논현동 하수관로 포화 위험이 감지됩니다.
            </p>
            <p className="text-[11px] font-semibold text-[#66809b] dark:text-[#94a3b8]">권고 조치 사항</p>
            <div className="flex flex-col gap-1.5">
              {[
                { color: '#f34236', text: '중랑천·탄천 하류 지역 주민 대피 권고 발령 즉시 검토' },
                { color: '#fe9600', text: '강남구 역삼1동·논현동 하수관로 역류 현장 점검 시행' },
                { color: '#fe9600', text: '소양강댐 하류 지자체 협조 요청 및 방류량 모니터링 강화' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-[5px] size-[4px] shrink-0 rounded-[2px]" style={{ background: item.color }} />
                  <p className="text-[11px] leading-[17px] text-[#1b2c42] dark:text-[#c8d6e8]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 6. 실시간 경보 현황 */}
          <div
            className="animate-slide-up flex flex-col gap-2.5 rounded-xl bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.08)] dark:bg-[#1e2d45] lg:col-span-2"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1b2c42] dark:text-[#e2e8f0]">실시간 경보 현황</span>
              <span className="rounded-[5px] bg-[rgba(243,66,54,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#f34236]">
                경보 {DASHBOARD_ALERTS.length}건
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {DASHBOARD_ALERTS.map((a, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-lg px-3 py-2.5" style={{ background: a.rowBg }}>
                  <div className="flex items-center justify-between">
                    <span className="rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                      style={{ background: a.typeBg, color: a.typeText }}>
                      {a.type}
                    </span>
                    <span className="text-[10px] text-[#97abc1]">{a.time}</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#1b2c42] dark:text-[#e2e8f0]">{a.place}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: 시간별 서울 평균 강수량 차트 ── */}
        <div
          className="shrink-0 animate-slide-up rounded-xl border border-[#dbe2ea] bg-white px-5 pb-5 pt-4 shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:border-[#2d3f5e] dark:bg-[#1e2d45]"
          style={{ animationDelay: '480ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#1b2c42] dark:text-[#e2e8f0]">시간별 서울 평균 강수량</span>
              <span className="rounded-[5px] bg-[rgba(30,135,229,0.12)] px-2 py-[3px] text-[10px] font-semibold text-[#1e87e5]">
                최근 6시간
              </span>
            </div>
            <span className="hidden text-[11px] text-[#97abc1] sm:block">
              AWS 89개소 · {pollTimeStr} 업데이트
            </span>
          </div>

          <div className="relative h-[180px] overflow-hidden rounded-xl bg-[#f0f4f8] dark:bg-[#0d1b2e]">
            {[0.25, 0.5, 0.75].map((f) => (
              <div key={f} className="absolute inset-x-0 border-t border-[#e2e8f0] dark:border-[#1e3050]"
                style={{ top: `${f * 100}%` }} />
            ))}

            {parseFloat(peakVal) > 0 && (
              <div
                className="absolute inset-x-0 z-10 flex items-center gap-2 px-3"
                style={{ bottom: `${Math.min((10 / parseFloat(peakVal)) * 82, 98)}%` }}
              >
                <div className="flex-1 border-t-[1.5px] border-dashed border-[#fe9600]/60" />
                <span className="shrink-0 rounded-[3px] bg-[#fe9600]/10 px-1.5 py-[1px] text-[9px] font-bold text-[#fe9600]">
                  10 mm/h
                </span>
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 top-0 flex items-end justify-around px-5">
              {chartBars.map((bar) => {
                const maxV = parseFloat(peakVal) || 1
                const pct  = Math.min((parseFloat(bar.value) / maxV) * 82, 98)
                return (
                  <div key={bar.hour} className="flex flex-col items-center justify-end gap-1.5" style={{ height: '100%', width: `${100 / chartBars.length}%` }}>
                    <span className={`text-[10px] font-bold transition-colors ${bar.active ? 'text-[#1e87e5]' : 'text-[#94a3b8]'}`}>
                      {bar.value}
                    </span>
                    <div
                      className="w-[28px] rounded-t-[5px] transition-all duration-500"
                      style={{
                        height: `${pct}%`,
                        minHeight: '4px',
                        background: bar.active
                          ? 'linear-gradient(to top, #1d6fb5 0%, #3b9fe8 100%)'
                          : 'linear-gradient(to top, rgba(30,110,175,0.55) 0%, rgba(59,159,232,0.25) 100%)',
                        boxShadow: bar.active ? '0 0 10px rgba(59,159,232,0.4)' : 'none',
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center justify-around border-t border-[#e2e8f0] bg-white/60 px-5 backdrop-blur-sm dark:border-[#1e3050] dark:bg-[#0d1b2e]/60">
              {chartBars.map((bar) => (
                <span key={bar.hour}
                  className={`text-center text-[10px] transition-colors ${bar.active ? 'font-bold text-[#1e87e5]' : 'text-[#94a3b8]'}`}
                  style={{ width: `${100 / chartBars.length}%` }}>
                  {bar.hour}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: 'linear-gradient(to top, #1d6fb5, #3b9fe8)' }} />
              <span className="text-[11px] text-[#66809b] dark:text-[#94a3b8]">피크 {peakVal} mm/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-[1.5px] border-dashed border-[#fe9600]/70" />
              <span className="text-[11px] text-[#66809b] dark:text-[#94a3b8]">경보 기준 10.0 mm/h</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="size-[5px] animate-pulse rounded-full bg-[#1e87e5]" />
              <span className="text-[11px] text-[#97abc1]">10분 단위 갱신 · {pollTimeStr}</span>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  )
}
