import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useClock } from '@/hooks/useClock'
import { getRainfallLevel, getRainfallLevelByStatus } from '@/utils/statusUtils'
import { rainfallApi } from '@/api/rainfall'
import { RAINFALL_LEGEND, toDatetimeLocal, fmtDateTime } from '@/mocks/rainfall'
import { SeoulMap } from './components'

const MAX_RANGE_MS = 3 * 24 * 60 * 60 * 1000   // 3 days

const SPEEDS = [
  { label: '×1', ms: 1200 },
  { label: '×2', ms: 600 },
  { label: '×4', ms: 300 },
]

const addMs = (dateStr, ms) =>
  toDatetimeLocal(new Date(new Date(dateStr).getTime() + ms))

const toDisplayData = (stations) =>
  (stations ?? []).reduce((acc, s) => ({ ...acc, [s.stationName]: s.rainfall10m ?? 0 }), {})

export function RainfallPage() {
  const now = useClock()

  const [mode, setMode]         = useState('realtime')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return toDatetimeLocal(d)
  })
  const [toDate, setToDate]     = useState(() => toDatetimeLocal(new Date()))

  const [displayData,       setDisplayData]       = useState({})
  const [snapshot,          setSnapshot]          = useState(null)
  const [playbackSteps,     setPlaybackSteps]     = useState([])
  const [playbackIdx,       setPlaybackIdx]       = useState(0)
  const [isPlaying,         setIsPlaying]         = useState(false)
  const [playbackTimestamp, setPlaybackTimestamp] = useState(null)
  const [isPeriodLoading,   setIsPeriodLoading]   = useState(false)
  const [periodError,       setPeriodError]       = useState(null)
  const [speedIdx,          setSpeedIdx]          = useState(0)

  const stepMs = SPEEDS[speedIdx].ms

  // ── Realtime query ──────────────────────────────────────────────────────────
  const { data: realtimeData, dataUpdatedAt } = useQuery({
    queryKey: QUERY_KEYS.RAINFALL.REALTIME,
    queryFn: () => rainfallApi.getRealtime(),
    enabled: mode === 'realtime',
    refetchInterval: 10 * 60 * 1000,
    staleTime: 9 * 60 * 1000,
  })

  useEffect(() => {
    if (mode !== 'realtime' || !realtimeData) return
    setSnapshot(realtimeData)
    setDisplayData(toDisplayData(realtimeData.stations))
  }, [realtimeData, mode])

  // ── Playback ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || playbackSteps.length === 0) return
    if (playbackIdx >= playbackSteps.length) { setIsPlaying(false); return }
    const step = playbackSteps[playbackIdx]
    setSnapshot(step)
    setDisplayData(step.displayData)
    setPlaybackTimestamp(new Date(step.observedAt))
    const id = setTimeout(() => setPlaybackIdx(i => i + 1), stepMs)
    return () => clearTimeout(id)
  }, [isPlaying, playbackIdx, playbackSteps, stepMs])

  // ── Date constraint handlers ─────────────────────────────────────────────────
  const handleFromDateChange = (val) => {
    setFromDate(val)
    if (!val || !toDate) return
    const fromMs = new Date(val).getTime()
    const toMs   = new Date(toDate).getTime()
    if (toMs <= fromMs)            setToDate(addMs(val, 10 * 60 * 1000))
    else if (toMs - fromMs > MAX_RANGE_MS) setToDate(addMs(val, MAX_RANGE_MS))
  }

  const handleToDateChange = (val) => {
    setToDate(val)
    if (!val || !fromDate) return
    const toMs   = new Date(val).getTime()
    const fromMs = new Date(fromDate).getTime()
    if (fromMs >= toMs)             setFromDate(addMs(val, -10 * 60 * 1000))
    else if (toMs - fromMs > MAX_RANGE_MS) setFromDate(addMs(val, -MAX_RANGE_MS))
  }

  // ── UI handlers ──────────────────────────────────────────────────────────────
  const handleRealtimeToggle = () => {
    if (mode === 'realtime') {
      setMode(null); setSnapshot(null); setDisplayData({})
    } else {
      setMode('realtime'); setIsPlaying(false); setPlaybackSteps([]); setPeriodError(null)
    }
  }

  const handlePeriodSearch = async () => {
    const fromMs = fromDate ? new Date(fromDate).getTime() : 0
    const toMs   = toDate   ? new Date(toDate).getTime()   : 0
    if (!fromDate || !toDate || fromMs >= toMs || toMs - fromMs > MAX_RANGE_MS) return

    setIsPeriodLoading(true); setPeriodError(null)
    setMode('period'); setIsPlaying(false); setPlaybackSteps([])
    setPlaybackIdx(0); setSnapshot(null); setDisplayData({})

    try {
      const steps = await rainfallApi.getPeriod(fromDate, toDate)
      if (!steps?.length) { setPeriodError('해당 기간에 데이터가 없습니다.'); return }
      const enriched = steps.map(s => ({ ...s, displayData: toDisplayData(s.stations) }))
      setPlaybackSteps(enriched)
      setPlaybackTimestamp(null)
      setIsPlaying(true)
    } catch {
      setPeriodError('데이터 조회에 실패했습니다.')
      setMode(null)
    } finally {
      setIsPeriodLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (playbackIdx >= playbackSteps.length) {
      setPlaybackIdx(0); setIsPlaying(true)    // restart
    } else {
      setIsPlaying(p => !p)
    }
  }

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const idx  = Math.min(
      Math.floor(((e.clientX - rect.left) / rect.width) * playbackSteps.length),
      playbackSteps.length - 1,
    )
    const step = playbackSteps[idx]
    setPlaybackIdx(idx)
    setIsPlaying(false)
    setSnapshot(step); setDisplayData(step.displayData); setPlaybackTimestamp(new Date(step.observedAt))
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const fromMs      = fromDate ? new Date(fromDate).getTime() : 0
  const toMs        = toDate   ? new Date(toDate).getTime()   : 0
  const rangeValid  = fromDate && toDate && fromMs < toMs && toMs - fromMs <= MAX_RANGE_MS
  const rangeOver   = fromDate && toDate && fromMs < toMs && toMs - fromMs > MAX_RANGE_MS
  const playbackDone = !isPlaying && playbackSteps.length > 0 && playbackIdx >= playbackSteps.length

  const toDateMax  = fromDate ? addMs(fromDate, MAX_RANGE_MS) : undefined
  const fromDateMin = toDate  ? addMs(toDate, -MAX_RANGE_MS)  : undefined

  const lastFetch = dataUpdatedAt ? new Date(dataUpdatedAt) : null
  const timeStr   = now.toLocaleTimeString('ko-KR', { hour12: false })
  const statusText = isPeriodLoading
    ? '조회 중...'
    : mode === 'realtime'
      ? `최종 갱신: ${lastFetch ? lastFetch.toLocaleTimeString('ko-KR', { hour12: false }) : '--:--:--'}  (10분 단위 갱신)`
      : isPlaying && playbackTimestamp
        ? `재생 중: ${fmtDateTime(playbackTimestamp)}`
        : playbackDone
          ? `재생 완료 (총 ${playbackSteps.length}개 스냅샷)`
          : `현재 시간: ${timeStr}`

  const avgRain            = snapshot != null ? Number(snapshot.averageRainfall).toFixed(1) : '—'
  const maxRain            = snapshot?.maxRainfall ?? 0
  const maxDistrict        = snapshot?.maxStationName ?? '—'
  const maxRainfallLevel   = snapshot?.maxRainfallLevel ?? 'NORMAL'
  const rankList           = snapshot?.rankList ?? []
  const alertCount         = snapshot?.alertCount ?? 0
  const alertDistricts     = snapshot?.alertDistricts ?? []

  const progressPct =
    playbackSteps.length > 0
      ? (Math.min(playbackIdx, playbackSteps.length) / playbackSteps.length) * 100
      : 0

  return (
    <DashboardLayout
      activeRoute={ROUTES.RAINFALL}
      alertCount={alertCount}
      outerBg="bg-[#f1f5f9]"
      fullHeight={false}
    >
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:p-4 scrollbar-hide dark:bg-[#0f1729]">

        {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
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
            <input
              type="datetime-local" value={fromDate}
              onChange={e => handleFromDateChange(e.target.value)}
              min={fromDateMin}
              className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none dark:border-[#2d3f5e] dark:bg-[#111d35] dark:text-[#e2e8f0]"
            />
            <span className="text-[12px] font-medium text-[#94a3b8]">~</span>
            <span className="text-[11px] text-[#94a3b8]">종료</span>
            <input
              type="datetime-local" value={toDate}
              onChange={e => handleToDateChange(e.target.value)}
              min={fromDate}
              max={toDateMax}
              className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none dark:border-[#2d3f5e] dark:bg-[#111d35] dark:text-[#e2e8f0]"
            />
            {rangeOver && (
              <span className="text-[10px] font-semibold text-[#e53e3e]">최대 3일</span>
            )}
            <button
              onClick={handlePeriodSearch}
              disabled={!rangeValid || isPeriodLoading}
              className="rounded-[6px] border border-[#6366f1] bg-[#6366f1] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPeriodLoading ? '조회 중' : '조회'}
            </button>
          </div>

          <div className="hidden flex-1 md:block" />
          <span className="hidden shrink-0 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:block">{statusText}</span>
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────────── */}
        {periodError && (
          <div className="rounded-[8px] border border-[#feb2b2] bg-[#fff5f5] px-4 py-2.5 text-[12px] font-medium text-[#e53e3e] dark:border-[#7f1d1d] dark:bg-[#2d0a0a] dark:text-[#fc8181]">
            {periodError}
          </div>
        )}

        {/* ── Main Row ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">

          {/* Map Panel */}
          <div className="flex h-[360px] flex-col overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white md:h-[440px] lg:h-auto lg:min-h-0 lg:flex-1 dark:border-[#2d3f5e] dark:bg-[#1e2d45]">

            {/* Map header */}
            <div className="flex h-12 shrink-0 items-center px-4">
              <span className="text-[14px] font-semibold text-[#1e293b] dark:text-[#e2e8f0] md:text-[15px]">서울시 구별 강수량 현황</span>
              <span className="ml-2 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">단위: mm/10min</span>
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
              {playbackDone && (
                <span className="ml-auto text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">재생 완료</span>
              )}
            </div>

            <div className="h-px shrink-0 bg-[#e2e8f0] dark:bg-[#2d3f5e]" />

            {/* Map */}
            <div className="relative min-h-0 flex-1 bg-[#f7fbff] dark:bg-[#111d35]">
              <SeoulMap rainfallData={displayData} />
            </div>

            {/* Playback controls */}
            {playbackSteps.length > 0 && (
              <div className="flex h-9 shrink-0 items-center gap-2 border-t border-[#e2e8f0] bg-[#f0f4ff] px-3 dark:border-[#2d3f5e] dark:bg-[#1a2540]">

                {/* Play / Pause / Restart */}
                <button
                  onClick={handlePlayPause}
                  title={playbackDone ? '처음부터 재생' : isPlaying ? '일시정지' : '재생'}
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-[4px] bg-[#6366f1] text-white transition-colors hover:bg-[#4f46e5]"
                >
                  {playbackDone ? (
                    /* restart icon */
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5 A4.5 4.5 0 1 0 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M10.5 2 L10.5 6 L6.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isPlaying ? (
                    /* pause icon */
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <rect x="1.5" y="1" width="2.5" height="8" rx="1"/>
                      <rect x="6" y="1" width="2.5" height="8" rx="1"/>
                    </svg>
                  ) : (
                    /* play icon */
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M2 1.5 L9 5 L2 8.5 Z"/>
                    </svg>
                  )}
                </button>

                {/* Step counter */}
                <span className="shrink-0 min-w-[56px] text-[10px] font-semibold text-[#6366f1]">
                  {Math.min(playbackIdx, playbackSteps.length)}/{playbackSteps.length}
                </span>

                {/* Seekbar */}
                <div
                  className="h-[6px] flex-1 cursor-pointer overflow-hidden rounded-full bg-[#ddd6fe] dark:bg-[#312e81]"
                  onClick={seekTo}
                  title="클릭하여 이동"
                >
                  <div
                    className="h-full rounded-full bg-[#6366f1] transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Current timestamp */}
                {playbackTimestamp && (
                  <span className="shrink-0 text-[10px] font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
                    {fmtDateTime(playbackTimestamp)}
                  </span>
                )}

                {/* Speed selector */}
                <div className="ml-1 flex shrink-0 gap-[3px]">
                  {SPEEDS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setSpeedIdx(i)}
                      className={`rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                        speedIdx === i
                          ? 'bg-[#6366f1] text-white'
                          : 'bg-[#ddd6fe] text-[#6366f1] hover:bg-[#c4b5fd] dark:bg-[#312e81] dark:hover:bg-[#4338ca]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
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

          {/* ── Right Stats Panel ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 md:gap-2.5 lg:w-[340px] lg:shrink-0 lg:overflow-y-auto scrollbar-hide">

            {/* Average rainfall */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '100ms' }}>
              <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">서울시 평균 강수량</p>
              <div className="mt-1 flex items-end gap-1.5">
                <span className="text-[20px] font-bold text-[#3b82f6] md:text-[22px]">{avgRain}</span>
                <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">mm/10min</span>
              </div>
            </div>

            {/* Max rainfall */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '200ms' }}>
              <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">최고 강수량 지역</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <div className="flex items-end gap-1.5">
                  <span className="text-[20px] font-bold text-[#ed8936] md:text-[22px]">{Number(maxRain).toFixed(1)}</span>
                  <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">mm/10min</span>
                </div>
                <span className="shrink-0 text-[10px] text-[#64748b] dark:text-[#94a3b8] md:text-[11px]">
                  ⚠ {getRainfallLevelByStatus(maxRainfallLevel).label} 단계
                </span>
              </div>
              <div className="mt-2">
                <span className="inline-block rounded-[5px] bg-[#fff3e0] px-2.5 py-0.5 text-[12px] font-semibold text-[#c05621] dark:bg-[#3d1f06] dark:text-[#fb923c]">
                  {maxDistrict}
                </span>
              </div>
            </div>

            {/* District ranking */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white p-3 md:p-4 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '300ms' }}>
              <p className="mb-2 text-[12px] font-semibold text-[#1e293b] dark:text-[#e2e8f0] md:text-[13px]">구별 강수량 순위 (Top 7)</p>
              <div className="flex flex-col gap-0.5">
                {rankList.length > 0 ? (
                  rankList.map((item, i) => {
                    const level = getRainfallLevelByStatus(item.rainfallLevel)
                    return (
                      <div key={`${item.stationName}-${item.rank}`} className={`flex items-center rounded-[4px] px-2 py-1.5 md:py-2 ${i % 2 !== 0 ? 'bg-[#f9fbfe] dark:bg-[#111d35]' : ''}`}>
                        <span className="w-5 text-[12px] font-bold text-[#1e293b] dark:text-white md:w-6 md:text-[13px]">{item.rank}</span>
                        <span className="w-16 text-[12px] font-medium text-[#1e293b] dark:text-[#e2e8f0] md:w-[72px] md:text-[13px]">{item.stationName}</span>
                        <span className="flex-1 text-[12px] font-medium text-[#1e293b] dark:text-white md:text-[13px]">
                          {item.rainfall10m != null ? item.rainfall10m.toFixed(1) : '—'} mm/10min
                        </span>
                        <span className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:text-[11px]" style={{ background: level.badgeBg, color: level.badgeText }}>
                          {level.label}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[12px] text-[#94a3b8]">데이터를 불러오는 중...</p>
                )}
              </div>
            </div>

            {/* Alert districts */}
            <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#1e2d45]" style={{ animationDelay: '400ms' }}>
              <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">경보 발령 구</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <div className="flex items-end gap-1.5">
                  <span className="text-[20px] font-bold text-[#e53e3e] md:text-[22px]">{alertCount}</span>
                  <span className="mb-0.5 text-[11px] text-[#64748b] dark:text-[#94a3b8] md:text-[12px]">개구</span>
                </div>
                <span className="shrink-0 text-[10px] text-[#64748b] dark:text-[#94a3b8] md:text-[11px]">
                  {alertDistricts.map(d => d.replace('구', '')).join('/')}
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
