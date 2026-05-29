import { useEffect, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useClock } from '@/hooks/useClock'
import { getRainfallLevel } from '@/utils/statusUtils'
import {
  MOCK_RAINFALL,
  RAINFALL_LEGEND,
  RAINFALL_ALERTS,
  toDatetimeLocal,
  fmtDateTime,
  buildMockSteps,
} from '@/mocks/rainfall'
import { SeoulMap } from './components'

export function RainfallPage() {
  const now = useClock()

  const [mode, setMode]         = useState(null)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return toDatetimeLocal(d)
  })
  const [toDate, setToDate]     = useState(() => toDatetimeLocal(new Date()))

  const [displayData,        setDisplayData]        = useState(MOCK_RAINFALL)
  const [lastFetch,          setLastFetch]           = useState(null)
  const [playbackSteps,      setPlaybackSteps]       = useState([])
  const [playbackIdx,        setPlaybackIdx]         = useState(0)
  const [isPlaying,          setIsPlaying]           = useState(false)
  const [playbackTimestamp,  setPlaybackTimestamp]   = useState(null)

  // Realtime: poll every 10 minutes
  useEffect(() => {
    if (mode !== 'realtime') return
    const fetch = () => {
      const data = {}
      Object.keys(MOCK_RAINFALL).forEach(k => {
        data[k] = Math.max(0, MOCK_RAINFALL[k] + (Math.random() - 0.5) * 6)
      })
      setDisplayData(data)
      setLastFetch(new Date())
    }
    fetch()
    const id = setInterval(fetch, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [mode])

  // Playback: advance one step per second
  useEffect(() => {
    if (!isPlaying || playbackSteps.length === 0) return
    if (playbackIdx >= playbackSteps.length) { setIsPlaying(false); return }
    const step = playbackSteps[playbackIdx]
    setDisplayData(step.data)
    setPlaybackTimestamp(step.timestamp)
    const id = setTimeout(() => setPlaybackIdx(i => i + 1), 1000)
    return () => clearTimeout(id)
  }, [isPlaying, playbackIdx, playbackSteps])

  const handleRealtimeToggle = () => {
    if (mode === 'realtime') {
      setMode(null)
      setDisplayData(MOCK_RAINFALL)
    } else {
      setMode('realtime')
      setIsPlaying(false)
      setPlaybackSteps([])
    }
  }

  const handlePeriodSearch = () => {
    if (!fromDate || !toDate) return
    const from = new Date(fromDate)
    const to   = new Date(toDate)
    if (from >= to) return
    setMode('period')
    const steps = buildMockSteps(from, to)
    setPlaybackSteps(steps)
    setPlaybackIdx(0)
    setPlaybackTimestamp(null)
    setIsPlaying(true)
  }

  const sortedByRain   = Object.entries(displayData).sort(([, a], [, b]) => b - a)
  const top7           = sortedByRain.slice(0, 7)
  const avgRain        = (Object.values(displayData).reduce((a, b) => a + b, 0) / Object.values(displayData).length).toFixed(1)
  const [maxDistrict, maxRain] = sortedByRain[0]
  const alertDistricts = sortedByRain.filter(([, v]) => v >= 30)
  const alertCount     = alertDistricts.length
  const timeStr        = now.toLocaleTimeString('ko-KR', { hour12: false })

  const statusText = mode === 'realtime'
    ? `최종 갱신: ${lastFetch ? lastFetch.toLocaleTimeString('ko-KR', { hour12: false }) : '--:--:--'}  (10분 단위 갱신)`
    : isPlaying && playbackTimestamp
      ? `재생 중: ${fmtDateTime(playbackTimestamp)}`
      : !isPlaying && playbackSteps.length > 0
        ? '재생 완료'
        : `현재 시간: ${timeStr}`

  return (
    <DashboardLayout
      activeRoute={ROUTES.RAINFALL}
      alertCount={alertCount}
      outerBg="bg-[#f1f5f9]"
      fullHeight={false}
    >
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:p-4 scrollbar-hide dark:bg-[#0f1729]">

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2.5 md:px-4 dark:border-[#2d3f5e] dark:bg-[#1e2d45]">
          <span className="shrink-0 text-[12px] font-semibold text-[#475569] dark:text-[#94a3b8] md:text-[13px]">기간 선택</span>

          <button
            onClick={handleRealtimeToggle}
            className={`flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mode === 'realtime'
                ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] dark:border-[#2d3f5e] dark:bg-[#111d35] dark:text-[#94a3b8] dark:hover:bg-[#243352]'
            }`}
          >
            {mode === 'realtime' && <span className="size-[6px] animate-pulse rounded-full bg-white" />}
            실시간
          </button>

          <div className="hidden h-5 w-px bg-[#e2e8f0] dark:bg-[#2d3f5e] md:block" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#94a3b8]">시작</span>
            <input type="datetime-local" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none dark:border-[#2d3f5e] dark:bg-[#111d35] dark:text-[#e2e8f0]" />
            <span className="text-[12px] font-medium text-[#94a3b8]">~</span>
            <span className="text-[11px] text-[#94a3b8]">종료</span>
            <input type="datetime-local" value={toDate} onChange={e => setToDate(e.target.value)}
              className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none dark:border-[#2d3f5e] dark:bg-[#111d35] dark:text-[#e2e8f0]" />
            <button
              onClick={handlePeriodSearch}
              disabled={!fromDate || !toDate || new Date(fromDate) >= new Date(toDate)}
              className="rounded-[6px] border border-[#6366f1] bg-[#6366f1] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              조회
            </button>
          </div>

          <div className="hidden flex-1 md:block" />
          <span className="hidden shrink-0 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:block">{statusText}</span>
        </div>

        {/* Main Row */}
        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">

          {/* Map Panel */}
          <div className="flex h-[360px] flex-col overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white md:h-[440px] lg:h-auto lg:min-h-0 lg:flex-1 dark:border-[#2d3f5e] dark:bg-[#1e2d45]">
            <div className="flex h-12 shrink-0 items-center px-4">
              <span className="text-[14px] font-semibold text-[#1e293b] dark:text-[#e2e8f0] md:text-[15px]">서울시 구별 강수량 현황</span>
              <span className="ml-2 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">단위: mm/hr</span>
              {isPlaying && (
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#6366f1]">
                  <span className="size-[6px] animate-pulse rounded-full bg-[#6366f1]" />
                  재생 중
                </span>
              )}
              {mode === 'realtime' && !isPlaying && (
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#3b82f6]">
                  <span className="size-[6px] animate-pulse rounded-full bg-[#3b82f6]" />
                  실시간
                </span>
              )}
            </div>
            <div className="h-px shrink-0 bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
            <div className="relative min-h-0 flex-1 bg-[#f7fbff] dark:bg-[#111d35]">
              <SeoulMap rainfallData={displayData} />
            </div>

            {playbackSteps.length > 0 && (
              <div className="flex h-8 shrink-0 items-center gap-3 border-t border-[#e2e8f0] bg-[#f0f4ff] px-4 dark:border-[#2d3f5e] dark:bg-[#1a2540]">
                <span className="shrink-0 text-[10px] font-semibold text-[#6366f1]">
                  {isPlaying ? '▶' : '■'} {Math.min(playbackIdx, playbackSteps.length)}/{playbackSteps.length}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ddd6fe]">
                  <div className="h-full rounded-full bg-[#6366f1] transition-all duration-700"
                    style={{ width: `${(Math.min(playbackIdx, playbackSteps.length) / playbackSteps.length) * 100}%` }} />
                </div>
                {playbackTimestamp && (
                  <span className="shrink-0 text-[10px] font-semibold text-[#1e293b] dark:text-[#e2e8f0]">{fmtDateTime(playbackTimestamp)}</span>
                )}
              </div>
            )}

            <div className="flex h-9 shrink-0 items-center gap-2 border-t border-[#e2e8f0] bg-white px-4 dark:border-[#2d3f5e] dark:bg-[#1e2d45]">
              <span className="text-[10px] font-medium text-[#1e293b] dark:text-[#e2e8f0]">강수 단계:</span>
              {RAINFALL_LEGEND.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="size-[9px] rounded-full" style={{ background: color }} />
                  <span className="text-[10px] text-[#475569] dark:text-[#94a3b8]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-2 md:gap-2.5 lg:w-[340px] lg:shrink-0 lg:overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-2.5 lg:grid-cols-1">

              <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '100ms' }}>
                <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">서울시 평균 강수량</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1.5">
                    <span className="text-[20px] font-bold text-[#3b82f6] md:text-[22px]">{avgRain}</span>
                    <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">mm/hr</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#64748b] dark:text-[#94a3b8] md:text-[11px]">▲ 3.2 전시간 대비</span>
                </div>
              </div>

              <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '200ms' }}>
                <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">최고 강수량 지역</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1.5">
                    <span className="text-[20px] font-bold text-[#ed8936] md:text-[22px]">{maxRain.toFixed(1)}</span>
                    <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">mm/hr ({maxDistrict})</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#64748b] dark:text-[#94a3b8] md:text-[11px]">⚠ {getRainfallLevel(maxRain).label} 단계</span>
                </div>
              </div>

              <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '300ms' }}>
                <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">경보 발령 구</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1.5">
                    <span className="text-[20px] font-bold text-[#e53e3e] md:text-[22px]">{alertCount}</span>
                    <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">개구</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#64748b] dark:text-[#94a3b8] md:text-[11px]">
                    {alertDistricts.map(([k]) => k.replace('구', '')).join('/')}
                  </span>
                </div>
              </div>
            </div>

            {/* District Ranking */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white p-3 md:p-4 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '400ms' }}>
              <p className="mb-2 text-[12px] font-semibold text-[#1e293b] dark:text-[#e2e8f0] md:text-[13px]">구별 강수량 순위 (Top 7)</p>
              <div className="flex flex-col gap-0.5">
                {top7.map(([district, rain], i) => {
                  const level = getRainfallLevel(rain)
                  return (
                    <div key={district} className={`flex items-center rounded-[4px] px-2 py-1.5 md:py-2 ${i % 2 !== 0 ? 'bg-[#f9fbfe] dark:bg-[#111d35]' : ''}`}>
                      <span className="w-5 text-[12px] font-bold text-[#64748b] dark:text-[#94a3b8] md:w-6 md:text-[13px]">{i + 1}</span>
                      <span className="w-16 text-[12px] font-medium text-[#1e293b] dark:text-[#e2e8f0] md:w-[72px] md:text-[13px]">{district}</span>
                      <span className="flex-1 text-[12px] font-medium md:text-[13px]" style={{ color: level.badgeText }}>{rain.toFixed(1)} mm/hr</span>
                      <span className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:text-[11px]" style={{ background: level.badgeBg, color: level.badgeText }}>
                        {level.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alert Panel */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white p-3 md:p-4 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '500ms' }}>
              <p className="mb-2.5 text-[12px] font-semibold text-[#e53e3e] md:mb-3 md:text-[13px]">⚠&nbsp;&nbsp;경보 현황</p>
              <div className="flex flex-col gap-2">
                {RAINFALL_ALERTS.map((alert, i) => (
                  <div key={i} className="rounded-[6px] px-3 py-2" style={{ background: alert.severe ? '#fff0f0' : '#fff7e5' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold md:text-[13px]" style={{ color: alert.severe ? '#b81515' : '#8c520a' }}>
                        {alert.district}&nbsp;&nbsp;{alert.type}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#64748b] md:text-[11px]">{alert.time}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#1e293b] md:text-[11px]">{alert.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
