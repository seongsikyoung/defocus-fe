import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useClock } from '@/hooks/useClock'
import { dashboardApi } from '@/api/dashboard'
import { Spinner } from '@/components/common/Spinner'

const IMG_LIVE_DOT = 'https://www.figma.com/api/mcp/asset/2a20294d-966d-4e00-9b2a-5eaa3e021b05'

const ALERT_TYPE_LABEL = {
  RAINFALL: '강수', RIVER: '하천', SEWER: '하수관',
  RAINFALL_RIVER: '강수·하천', RAINFALL_SEWER: '강수·하수관',
  RIVER_SEWER: '하천·하수관', COMBINED: '복합',
}
const ALERT_LEVEL_LABEL = { CAUTION: '주의', WARNING: '경고', DANGER: '위험' }

function rainfallStyle(status) {
  if (status === 'WARNING' || status === 'DANGER')
    return { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
  if (status === 'CAUTION')
    return { label: '주의', bg: 'rgba(254,150,0,0.15)',  text: '#fe9600', border: 'rgba(254,150,0,0.25)',  accent: '#fe9600' }
  return   { label: '정상', bg: 'rgba(30,135,229,0.15)', text: '#1e87e5', border: 'rgba(30,135,229,0.25)', accent: '#1e87e5' }
}

function riverStyle(status) {
  if (status === 'DANGER' || status === 'OVERFLOW')
    return { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
  if (status === 'CAUTION')
    return { label: '주의', bg: 'rgba(254,150,0,0.15)',  text: '#fe9600', border: 'rgba(254,150,0,0.25)',  accent: '#fe9600' }
  return   { label: '정상', bg: 'rgba(36,197,82,0.15)',  text: '#24c552', border: 'rgba(36,197,82,0.25)',  accent: '#24c552' }
}

function sewerStyle(status) {
  if (status === 'DANGER' || status === 'FULL')
    return { label: '경보', bg: 'rgba(243,66,54,0.15)',  text: '#f34236', border: 'rgba(243,66,54,0.25)',  accent: '#f34236' }
  if (status === 'WARNING' || status === 'CAUTION')
    return { label: '주의', bg: 'rgba(254,150,0,0.15)',  text: '#fe9600', border: 'rgba(254,150,0,0.25)',  accent: '#fe9600' }
  return   { label: '정상', bg: 'rgba(36,197,82,0.15)',  text: '#24c552', border: 'rgba(36,197,82,0.25)',  accent: '#24c552' }
}

function alertLevelStyle(level) {
  if (level === 'DANGER')
    return { typeBg: 'rgba(243,66,54,0.15)', typeText: '#f34236', rowBg: 'rgba(243,66,54,0.07)' }
  return   { typeBg: 'rgba(254,150,0,0.15)', typeText: '#fe9600', rowBg: 'rgba(254,150,0,0.07)' }
}

function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function splitSentences(text) {
  if (!text) return []
  // split after 。 or . followed by whitespace, keeping the period with the sentence
  return text.split(/(?<=[。.])\s+/).map(s => s.trim()).filter(Boolean)
}

export function DashboardPage() {
  const now = useClock()
  const queryClient = useQueryClient()

  const { data, dataUpdatedAt, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.SUMMARY,
    queryFn: dashboardApi.getSummary,
    select: (res) => res.data,
    refetchInterval: 10 * 60 * 1000,
  })

  const [isRefreshing, setIsRefreshing]           = useState(false)
  const [isAlertRefreshing, setIsAlertRefreshing] = useState(false)
  const [freshAlerts, setFreshAlerts]             = useState(null)

  const handleAiRefresh = async () => {
    setIsRefreshing(true)
    try {
      await dashboardApi.refreshAiAnalysis()
      await refetch()
    } catch {
      // API 실패 시 무시
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAlertRefresh = async () => {
    setIsAlertRefreshing(true)
    setFreshAlerts(null)
    try {
      const res = await dashboardApi.refreshAlerts()
      const newAlerts = res.data ?? []
      setFreshAlerts(newAlerts)
      // 캐시를 직접 갱신 — 탭 이동 후 돌아와도 재산정 결과 유지
      queryClient.setQueryData(QUERY_KEYS.DASHBOARD.SUMMARY, (old) => {
        if (!old) return old
        return { ...old, data: { ...old.data, recentAlerts: newAlerts } }
      })
    } catch {
      setFreshAlerts([])
    } finally {
      setIsAlertRefreshing(false)
    }
  }

  const lastFetchStr = formatTime(dataUpdatedAt)

  const rainfall    = data?.rainfall
  const river       = data?.river
  const sewer       = data?.sewer
  const stations    = data?.stations
  const hourly      = data?.hourlyRainfall
  const aiAnalysis  = data?.aiAnalysis
  const alerts      = freshAlerts ?? data?.recentAlerts ?? []

  const rfStyle = rainfallStyle(rainfall?.status)
  const rvStyle = riverStyle(river?.maxStatus)
  const swStyle = sewerStyle(sewer?.maxStatus)

  const peakVal = hourly?.peakRainfall?.toFixed(1) ?? '0.0'

  const chartBars = useMemo(() => {
    const history = hourly?.history ?? []
    if (!history.length) return []
    const maxH = Math.max(...history.map(p => p.avgRainfall), 0.1)
    return history.map((point, i) => ({
      hour:   point.hour,
      value:  point.avgRainfall.toFixed(1),
      active: i === history.length - 1,
      pct:    Math.min((point.avgRainfall / maxH) * 82, 98),
    }))
  }, [hourly])

  return (
    <DashboardLayout
      activeRoute={ROUTES.DASHBOARD}
      alertCount={alerts.length}
      onTabReclick={refetch}
    >
      <main className="flex flex-1 flex-col gap-4 overflow-auto px-3 pt-3 pb-[calc(56px+12px)] md:p-5 md:pb-5 scrollbar-hide dark:bg-[#0f1729]">

        {/* ── Row 1: KPI Cards ── */}
        <div className="shrink-0 grid grid-cols-2 gap-4 xl:grid-cols-4">

          {/* 1. 서울 평균 강수량 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: rfStyle.border, animationDelay: '0ms' }}
          >
            <div className="h-[3px]" style={{ background: rfStyle.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ color: rfStyle.accent }}>
                    <path d="M10 6a2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-2.4 1.8H4.5a1.5 1.5 0 0 0 0 3h5a1.5 1.5 0 0 0 0-3H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.5 10.5L4 12M7 10.5l-.5 1.5M9.5 10.5L9 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[12px] font-semibold leading-tight text-[#374151] dark:text-[#94a3b8] md:text-[13px]">
                    서울 평균 강수량
                  </span>
                </div>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: rfStyle.bg, color: rfStyle.text }}>
                  {rfStyle.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading
                  ? <div className="flex h-[36px] items-center"><Spinner size={28} color={rfStyle.accent} /></div>
                  : <span className="text-[30px] font-bold leading-none md:text-[34px]" style={{ color: rfStyle.accent }}>
                      {rainfall?.avgRainfall?.toFixed(1) ?? '0.0'}
                    </span>
                }
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">mm/h</span>
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: rfStyle.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위: {lastFetchStr}</span>
              </div>
            </div>
          </div>

          {/* 2. 하천 위험 지점 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: rvStyle.border, animationDelay: '80ms' }}
          >
            <div className="h-[3px]" style={{ background: rvStyle.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ color: rvStyle.accent }}>
                    <path d="M1 5c1-1.5 2.2-1.5 3.2 0s2.2 1.5 3.2 0S9.6 3.5 10.6 5l1.4 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 9c1-1.5 2.2-1.5 3.2 0s2.2 1.5 3.2 0 2.2-1.5 3.2 0l1.4 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[12px] font-semibold leading-tight text-[#374151] dark:text-[#94a3b8] md:text-[13px]">
                    하천 위험 지점
                  </span>
                </div>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: rvStyle.bg, color: rvStyle.text }}>
                  {rvStyle.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading
                  ? <div className="flex h-[36px] items-center"><Spinner size={28} color={rvStyle.accent} /></div>
                  : <span className="text-[30px] font-bold leading-none md:text-[34px]" style={{ color: rvStyle.accent }}>
                      {river?.dangerCount ?? 0}
                    </span>
                }
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: rvStyle.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위: {lastFetchStr}</span>
              </div>
            </div>
          </div>

          {/* 3. 하수관로 위험 지점 */}
          <div
            className="animate-slide-up overflow-hidden rounded-xl border bg-white shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:bg-[#1e2d45]"
            style={{ borderColor: swStyle.border, animationDelay: '160ms' }}
          >
            <div className="h-[3px]" style={{ background: swStyle.accent }} />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ color: swStyle.accent }}>
                    <rect x="1" y="5.5" width="12" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4.5 5.5V3.5M9.5 5.5V3.5M4.5 8.5v2M9.5 8.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[12px] font-semibold leading-tight text-[#374151] dark:text-[#94a3b8] md:text-[13px]">
                    하수관로 위험 지점
                  </span>
                </div>
                <span className="shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                  style={{ background: swStyle.bg, color: swStyle.text }}>
                  {swStyle.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading
                  ? <div className="flex h-[36px] items-center"><Spinner size={28} color={swStyle.accent} /></div>
                  : <span className="text-[30px] font-bold leading-none md:text-[34px]" style={{ color: swStyle.accent }}>
                      {sewer?.dangerCount ?? 0}
                    </span>
                }
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="size-[5px] shrink-0 animate-pulse rounded-full"
                  style={{ background: swStyle.accent }} />
                <span className="text-[10px] text-[#97abc1]">10분 단위: {lastFetchStr}</span>
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
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#24c552]">
                    <path d="M1.5 12V8.5M4.5 12V5M7.5 12V2M10.5 12V6M13.5 12V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[12px] font-semibold leading-tight text-[#374151] dark:text-[#94a3b8] md:text-[13px]">
                    전체 관측소
                  </span>
                </div>
                <span className="shrink-0 rounded-[5px] bg-[rgba(36,197,82,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#24c552]">
                  운영 중
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading
                  ? <div className="flex h-[36px] items-center"><Spinner size={28} color="#24c552" /></div>
                  : <span className="text-[30px] font-bold leading-none text-[#24c552] md:text-[34px]">
                      {stations?.total ?? 0}
                    </span>
                }
                <span className="text-[12px] font-medium text-[#66809b] dark:text-[#94a3b8]">개소</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: '정상', count: stations?.normal  ?? 0, color: '#24c552', bg: 'rgba(36,197,82,0.1)'  },
                  { label: '주의', count: stations?.caution ?? 0, color: '#fe9600', bg: 'rgba(254,150,0,0.1)'  },
                  { label: '위험', count: stations?.danger  ?? 0, color: '#f34236', bg: 'rgba(243,66,54,0.1)'  },
                ].map(({ label, count, color, bg }) => {
                  const pct = stations?.total ? Math.round(count / stations.total * 100) : 0
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-[10px] font-semibold" style={{ color }}>{label}</span>
                      <div className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: bg }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="w-5 shrink-0 text-right text-[10px] font-bold" style={{ color }}>{count}</span>
                    </div>
                  )
                })}
              </div>
              <span className="text-[10px] text-[#97abc1]">10분 단위: {lastFetchStr}</span>
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#00b8d1]">
                  <path d="M7 1.5L8.4 5.6H12.5L9.1 8.1l1.4 4.2L7 9.8l-3.5 2.5 1.4-4.2L1.5 5.6H5.6Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                </svg>
                <span className="text-[14px] font-semibold text-[#00b8d1]">AI 현 상황 분석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-[6px] border border-[rgba(219,226,234,0.5)] bg-white px-2.5 py-1 dark:border-[#2d3f5e] dark:bg-[#111d35]">
                  <img src={IMG_LIVE_DOT} alt="" className="size-[6px]" />
                  <span className="text-[11px] text-[#66809b] dark:text-[#94a3b8]">
                    {aiAnalysis ? formatTime(aiAnalysis.createdAt) : lastFetchStr} 분석
                  </span>
                </div>
                <button
                  onClick={handleAiRefresh}
                  disabled={isRefreshing}
                  title="지금 AI 재분석"
                  className="flex size-[26px] items-center justify-center rounded-[6px] border border-[rgba(0,184,209,0.3)] text-[#00b8d1] transition-colors hover:bg-[rgba(0,184,209,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M6.5 2 L9 4.5 L6.5 2 L4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {aiAnalysis ? (
              <>
                <div className="flex flex-col gap-2">
                  {splitSentences(aiAnalysis.summary).map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[#00b8d1]" />
                      <p className="text-[13px] leading-[1.7] text-[#1b2c42] dark:text-[#c8d6e8]">{s}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] font-semibold text-[#66809b] dark:text-[#94a3b8]">권고 조치 사항</p>
                <div className="flex flex-col gap-2">
                  {splitSentences(aiAnalysis.recommendation).map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[#00b8d1] opacity-50" />
                      <p className="text-[13px] leading-[1.7] text-[#1b2c42] dark:text-[#c8d6e8]">{s}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[#97abc1]">AI 분석 데이터를 불러오는 중입니다...</p>
            )}
          </div>

          {/* 6. 실시간 경보 현황 */}
          <div
            className="animate-slide-up flex flex-col gap-2.5 rounded-xl bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.08)] dark:bg-[#1e2d45] lg:col-span-2"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#f34236]">
                  <path d="M7 1.5a3.5 3.5 0 0 1 3.5 3.5v2.5l1 1.5H2.5L3.5 7.5V5A3.5 3.5 0 0 1 7 1.5Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M5.5 10.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="7" cy="1.5" r="0.6" fill="currentColor"/>
                </svg>
                <span className="text-[14px] font-semibold text-[#1b2c42] dark:text-[#e2e8f0]">실시간 경보 현황</span>
              </div>
              <div className="flex items-center gap-2">
                {isAlertRefreshing ? (
                  <span className="text-[10px] text-[#97abc1]">측정 중...</span>
                ) : alerts.length > 0 ? (
                  <span className="rounded-[5px] bg-[rgba(243,66,54,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#f34236]">
                    경보 {alerts.length}건
                  </span>
                ) : (
                  <span className="rounded-[5px] bg-[rgba(36,197,82,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#24c552]">
                    이상 없음
                  </span>
                )}
                <button
                  onClick={handleAlertRefresh}
                  disabled={isAlertRefreshing}
                  title="지금 경보 재측정"
                  className="flex size-[26px] items-center justify-center rounded-[6px] border border-[rgba(243,66,54,0.3)] text-[#f34236] transition-colors hover:bg-[rgba(243,66,54,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAlertRefreshing ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M6.5 2 L9 4.5 L6.5 2 L4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {isAlertRefreshing && (
              <p className="text-[11px] text-[#97abc1]">최신 관측 데이터 기반으로 위험도·경보를 재산정하는 중입니다...</p>
            )}
            {!isAlertRefreshing && alerts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {alerts.map((a, i) => {
                  const style = alertLevelStyle(a.alertLevel)
                  const typeLabel = ALERT_TYPE_LABEL[a.alertType] ?? a.alertType
                  const levelLabel = ALERT_LEVEL_LABEL[a.alertLevel] ?? a.alertLevel
                  return (
                    <div key={i} className="flex flex-col gap-1 rounded-lg px-3 py-2.5" style={{ background: style.rowBg }}>
                      <div className="flex items-center justify-between">
                        <span className="rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                          style={{ background: style.typeBg, color: style.typeText }}>
                          {typeLabel} {levelLabel}
                        </span>
                        <span className="text-[10px] text-[#97abc1]">{formatTime(a.issuedAt)}</span>
                      </div>
                      <p className="text-[11px] font-medium text-[#1b2c42] dark:text-[#e2e8f0]">{a.regionName}</p>
                    </div>
                  )
                })}
              </div>
            ) : !isAlertRefreshing && (
              <p className="text-[12px] text-[#97abc1]">현재 발령 중인 경보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* ── Row 3: 시간별 서울 평균 강수량 차트 ── */}
        <div
          className="shrink-0 animate-slide-up rounded-xl border border-[#dbe2ea] bg-white px-5 pb-5 pt-4 shadow-[0px_4px_16px_0px_rgba(38,64,102,0.1)] dark:border-[#2d3f5e] dark:bg-[#1e2d45]"
          style={{ animationDelay: '480ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" className="shrink-0 text-[#1e87e5]">
                  <rect x="1" y="9.5" width="3.5" height="4.5" rx="1" fill="currentColor" fillOpacity="0.35"/>
                  <rect x="6.25" y="5.5" width="3.5" height="8.5" rx="1" fill="currentColor" fillOpacity="0.6"/>
                  <rect x="11.5" y="1.5" width="3.5" height="12.5" rx="1" fill="currentColor" fillOpacity="0.9"/>
                </svg>
                <span className="text-[15px] font-semibold text-[#1b2c42] dark:text-[#e2e8f0]">시간별 서울 평균 강수량</span>
              </div>
              <span className="rounded-[5px] bg-[rgba(30,135,229,0.12)] px-2 py-[3px] text-[10px] font-semibold text-[#1e87e5]">
                최근 6시간
              </span>
            </div>
            <span className="hidden text-[11px] text-[#97abc1] sm:block">
              10분 단위: {lastFetchStr}
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
              {chartBars.map((bar) => (
                <div key={bar.hour} className="flex flex-col items-center justify-end gap-1.5" style={{ height: '100%', width: `${100 / chartBars.length}%` }}>
                  <span className={`text-[10px] font-bold transition-colors ${bar.active ? 'text-[#1e87e5]' : 'text-[#94a3b8]'}`}>
                    {bar.value}
                  </span>
                  <div
                    className="w-[28px] rounded-t-[5px] transition-all duration-500"
                    style={{
                      height: `${bar.pct}%`,
                      minHeight: '4px',
                      background: bar.active
                        ? 'linear-gradient(to top, #1d6fb5 0%, #3b9fe8 100%)'
                        : 'linear-gradient(to top, rgba(30,110,175,0.55) 0%, rgba(59,159,232,0.25) 100%)',
                      boxShadow: bar.active ? '0 0 10px rgba(59,159,232,0.4)' : 'none',
                    }}
                  />
                </div>
              ))}
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
              <span className="text-[11px] text-[#97abc1]">10분 단위: {lastFetchStr}</span>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  )
}
