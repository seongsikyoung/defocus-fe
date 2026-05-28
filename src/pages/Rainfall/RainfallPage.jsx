import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import polylabel from 'polylabel'
import { ROUTES } from '@/constants/routes'
import geoData from '../../../gu.json'

const MOCK_RAINFALL = {
  '도봉구': 8.5,  '노원구': 13.1, '강북구': 9.2,  '은평구': 5.7,  '성북구': 18.6,
  '중랑구': 23.4, '서대문구': 7.3,'종로구': 15.2, '동대문구': 21.7,'광진구': 28.9,
  '마포구': 6.8,  '용산구': 11.5, '중구': 14.3,  '성동구': 26.4, '강동구': 20.1,
  '양천구': 4.3,  '영등포구': 8.8,'동작구': 17.3, '서초구': 33.7, '강남구': 44.2,
  '강서구': 3.9,  '구로구': 5.1,  '관악구': 20.8, '금천구': 9.7,  '송파구': 39.6,
}

function getRainfallLevel(mm) {
  if (mm >= 50) return { label: '위험', mapColor: '#1e3a8a', textColor: '#ffffff', badgeBg: '#1e3a8a', badgeText: '#ffffff' }
  if (mm >= 30) return { label: '경계', mapColor: '#2563eb', textColor: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' }
  if (mm >= 20) return { label: '주의', mapColor: '#60a5fa', textColor: '#1e293b', badgeBg: '#93c5fd', badgeText: '#1e40af' }
  if (mm >= 10) return { label: '관심', mapColor: '#93c5fd', textColor: '#1e293b', badgeBg: '#bfdbfe', badgeText: '#1e40af' }
  return { label: '정상', mapColor: '#dbeafe', textColor: '#1e293b', badgeBg: '#dbeafe', badgeText: '#1d4ed8' }
}

const LEGEND = [
  { label: '정상', color: '#dbeafe' },
  { label: '관심', color: '#93c5fd' },
  { label: '주의', color: '#60a5fa' },
  { label: '경계', color: '#2563eb' },
  { label: '위험', color: '#1e3a8a' },
]

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황',    active: false, route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황',    active: true,  route: ROUTES.RAINFALL  },
  { label: '수위', sub: '하천·하수관', active: false, route: ROUTES.RIVER     },
  { label: 'AI',   sub: 'AI분석',      active: false, route: null             },
]

const ALERTS = [
  { district: '강남구', type: '호우 경보',   time: '14:20', desc: '시간당 44mm 이상 — 도심 침수 위험',     severe: true  },
  { district: '서초구', type: '호우 경보',   time: '14:25', desc: '시간당 34mm — 배수불량 구간 침수',      severe: true  },
  { district: '송파구', type: '호우 주의보', time: '14:28', desc: '3시간 누적 62mm — 관심 필요',           severe: false },
]

const pad2 = n => String(n).padStart(2, '0')
const toDatetimeLocal = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const fmtDateTime = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`

function buildMockSteps(from, to) {
  const steps = []
  let cur = new Date(from)
  const end = new Date(to)
  const totalMs = Math.max(end - cur, 1)
  let i = 0
  while (cur <= end && i < 144) {
    const peak = Math.sin((i / Math.max(1, (totalMs / (10 * 60 * 1000)))) * Math.PI)
    const data = {}
    Object.keys(MOCK_RAINFALL).forEach(k => {
      data[k] = Math.max(0, MOCK_RAINFALL[k] * (0.25 + peak * 0.9) + (Math.random() - 0.5) * 8)
    })
    steps.push({ timestamp: new Date(cur), data })
    cur = new Date(cur.getTime() + 10 * 60 * 1000)
    i++
  }
  return steps
}

// ─── SeoulMap ────────────────────────────────────────────────────────────────
// Two effects: full draw on mount/resize; quick color-only update on data change.
function SeoulMap({ rainfallData }) {
  const containerRef = useRef(null)
  const svgRef       = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const dataRef         = useRef(rainfallData)
  const initializedRef  = useRef(false)
  const skipFirstRef    = useRef(true)

  useEffect(() => { dataRef.current = rainfallData }, [rainfallData])

  // Full draw — mount + resize only
  useEffect(() => {
    const draw = () => {
      if (!svgRef.current || !containerRef.current) return
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      initializedRef.current = false
      skipFirstRef.current   = true

      const { width, height } = containerRef.current.getBoundingClientRect()
      if (!width || !height) return

      const snap       = dataRef.current
      const projection = d3.geoMercator().fitSize([width, height], geoData)
      const pathGen    = d3.geoPath().projection(projection)

      const districtG = svg.append('g').attr('class', 'districts')
      const labelG    = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none')

      districtG.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).mapColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.2)
        .attr('cursor', 'pointer')
        .attr('opacity', 0)
        .attr('transform', 'translate(0,10)')
        .on('mousemove', function (event, d) {
          const [x, y] = d3.pointer(event, svgRef.current)
          const name   = d.properties.name
          const rain   = dataRef.current[name] || 0
          d3.select(this).raise().attr('stroke', '#0ea5e9').attr('stroke-width', 2.5)
          setTooltip({ x, y, name, rain })
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke', 'white').attr('stroke-width', 1.2)
          setTooltip(null)
        })
        .transition()
        .duration(420)
        .ease(d3.easeCubicOut)
        .delay(d => {
          const b  = pathGen.bounds(d)
          const cx = (b[0][0] + b[1][0]) / 2
          return 60 + (cx / width) * 560
        })
        .attr('opacity', 1)
        .attr('transform', 'translate(0,0)')

      const getLabelPoint = feature => {
        const project = coord => projection(coord)
        let rings
        if (feature.geometry.type === 'Polygon') {
          rings = feature.geometry.coordinates.map(r => r.map(project))
        } else {
          const largest = feature.geometry.coordinates.reduce((a, b) => {
            const aA = Math.abs(d3.polygonArea(a[0].map(project)))
            const bA = Math.abs(d3.polygonArea(b[0].map(project)))
            return aA >= bA ? a : b
          })
          rings = largest.map(r => r.map(project))
        }
        return polylabel(rings, 0.5)
      }
      const labelPts = new Map(geoData.features.map(f => [f, getLabelPoint(f)]))
      const cx = d => labelPts.get(d)[0]
      const cy = d => labelPts.get(d)[1]

      labelG.selectAll('text.dname')
        .data(geoData.features).join('text')
        .attr('class', 'dname')
        .attr('x', cx).attr('y', d => cy(d) - 2)
        .attr('text-anchor', 'middle').attr('font-size', '8px').attr('font-weight', '600')
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => d.properties.name)

      labelG.selectAll('text.dval')
        .data(geoData.features).join('text')
        .attr('class', 'dval')
        .attr('x', cx).attr('y', d => cy(d) + 9)
        .attr('text-anchor', 'middle').attr('font-size', '7px')
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => `${(snap[d.properties.name] || 0).toFixed(1)}`)

      labelG.selectAll('text')
        .transition().duration(300).delay(700).attr('opacity', 1)

      initializedRef.current = true
    }

    draw()
    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Quick color+value update — no redraw, no animation reset
  useEffect(() => {
    if (skipFirstRef.current) { skipFirstRef.current = false; return }
    if (!initializedRef.current || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('.districts path')
      .transition().duration(700).ease(d3.easeCubicOut)
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).mapColor)
    svg.selectAll('text.dval')
      .text(d => `${(rainfallData[d.properties.name] || 0).toFixed(1)}`)
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
    svg.selectAll('text.dname')
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
  }, [rainfallData])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full" style={{ overflow: 'hidden' }} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 400) - 130),
            top:  Math.max(4, tooltip.y - 56),
          }}
        >
          <p className="text-[12px] font-semibold text-[#1e293b]">{tooltip.name}</p>
          <p className="text-[14px] font-bold text-[#3b82f6]">{tooltip.rain.toFixed(1)} mm/hr</p>
          <p className="text-[11px] text-[#64748b]">{getRainfallLevel(tooltip.rain).label}</p>
        </div>
      )}
    </div>
  )
}

// ─── RainfallPage ─────────────────────────────────────────────────────────────
export function RainfallPage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  // mode: null | 'realtime' | 'period'
  const [mode, setMode]         = useState(null)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return toDatetimeLocal(d)
  })
  const [toDate, setToDate]     = useState(() => toDatetimeLocal(new Date()))

  const [displayData, setDisplayData]             = useState(MOCK_RAINFALL)
  const [lastFetch,   setLastFetch]               = useState(null)
  const [playbackSteps,    setPlaybackSteps]       = useState([])
  const [playbackIdx,      setPlaybackIdx]         = useState(0)
  const [isPlaying,        setIsPlaying]           = useState(false)
  const [playbackTimestamp,setPlaybackTimestamp]   = useState(null)

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
    if (playbackIdx >= playbackSteps.length) {
      setIsPlaying(false)
      return
    }
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

  const sortedByRain     = Object.entries(displayData).sort(([, a], [, b]) => b - a)
  const top7             = sortedByRain.slice(0, 7)
  const avgRain          = (Object.values(displayData).reduce((a, b) => a + b, 0) / Object.values(displayData).length).toFixed(1)
  const [maxDistrict, maxRain] = sortedByRain[0]
  const alertDistricts   = sortedByRain.filter(([, v]) => v >= 30)
  const alertCount       = alertDistricts.length
  const timeStr          = now.toLocaleTimeString('ko-KR', { hour12: false })

  const statusText = mode === 'realtime'
    ? `최종 갱신: ${lastFetch ? lastFetch.toLocaleTimeString('ko-KR', { hour12: false }) : '--:--:--'}  (10분 단위 갱신)`
    : isPlaying && playbackTimestamp
      ? `재생 중: ${fmtDateTime(playbackTimestamp)}`
      : !isPlaying && playbackSteps.length > 0
        ? '재생 완료'
        : `현재 시간: ${timeStr}`

  return (
    <div className="flex flex-col bg-[#f1f5f9] lg:h-screen lg:overflow-hidden">

      {/* ── Header ── */}
      <header className="grid h-14 shrink-0 grid-cols-[84px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-center">
          <div className="flex size-[30px] items-center justify-center rounded-full bg-[#3b82f6]">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </div>
        <p className="truncate px-2 text-center text-[13px] font-bold text-[#1e293b] sm:text-[15px]">
          실시간 강수 재난안전 통합 모니터링 시스템
        </p>
        <div className="flex items-center gap-2 pr-4 sm:gap-3 sm:pr-5">
          <div className="flex items-center gap-1.5 rounded-full border border-[#e53333] bg-[#ffe5e5] px-2.5 py-1 sm:px-3">
            <span className="size-[7px] rounded-full bg-[#e53333]" />
            <span className="text-[11px] font-medium text-[#cc1a1a]">경보 {alertCount}건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] sm:block">{timeStr}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        {/* ── Left Nav ── */}
        <nav className="relative flex w-[84px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white">
          <div className="flex w-full flex-col">
            {NAV_ITEMS.map(({ label, sub, active, route }) => (
              <div
                key={label}
                onClick={() => route && navigate(route)}
                className={`relative flex w-full flex-col items-center py-3 md:py-4 ${
                  active ? 'bg-[rgba(185,217,254,0.4)]' : `${route ? 'cursor-pointer hover:bg-[#f1f5f9]' : ''}`
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-[#3b82f6]" />}
                <span className={`text-[13px] md:text-[14px] ${active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#64748b]'}`}>{label}</span>
                <span className={`text-[8px] md:text-[9px] ${active ? 'text-[#3b82f6]' : 'text-[#64748b]'}`}>{sub}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex w-full cursor-pointer flex-col items-center py-3 hover:bg-[#f1f5f9] md:py-4">
            <span className="text-[13px] font-medium text-[#64748b] md:text-[14px]">설정</span>
            <span className="text-[8px] text-[#64748b] md:text-[9px]">설정</span>
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:p-4 scrollbar-hide">

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2.5 md:px-4">
            <span className="shrink-0 text-[12px] font-semibold text-[#475569] md:text-[13px]">기간 선택</span>

            {/* 실시간 */}
            <button
              onClick={handleRealtimeToggle}
              className={`flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                mode === 'realtime'
                  ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                  : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            >
              {mode === 'realtime' && <span className="size-[6px] animate-pulse rounded-full bg-white" />}
              실시간
            </button>

            <div className="hidden h-5 w-px bg-[#e2e8f0] md:block" />

            {/* 기간 입력 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#94a3b8]">시작</span>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none"
              />
              <span className="text-[12px] font-medium text-[#94a3b8]">~</span>
              <span className="text-[11px] text-[#94a3b8]">종료</span>
              <input
                type="datetime-local"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#1e293b] focus:border-[#3b82f6] focus:outline-none"
              />
              <button
                onClick={handlePeriodSearch}
                disabled={!fromDate || !toDate || new Date(fromDate) >= new Date(toDate)}
                className="rounded-[6px] border border-[#6366f1] bg-[#6366f1] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                조회
              </button>
            </div>

            <div className="hidden flex-1 md:block" />
            <span className="hidden shrink-0 text-[11px] text-[#64748b] md:block">{statusText}</span>
          </div>

          {/* Main Row */}
          <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">

            {/* Map Panel */}
            <div className="flex h-[360px] flex-col overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white md:h-[440px] lg:h-auto lg:min-h-0 lg:flex-1">
              <div className="flex h-12 shrink-0 items-center px-4">
                <span className="text-[14px] font-semibold text-[#1e293b] md:text-[15px]">서울시 구별 강수량 현황</span>
                <span className="ml-2 text-[11px] text-[#64748b] md:text-[12px]">단위: mm/hr</span>
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
              <div className="h-px shrink-0 bg-[#e2e8f0]" />
              <div className="relative min-h-0 flex-1 bg-[#f7fbff]">
                <SeoulMap rainfallData={displayData} />
              </div>

              {/* Playback progress bar */}
              {playbackSteps.length > 0 && (
                <div className="flex h-8 shrink-0 items-center gap-3 border-t border-[#e2e8f0] bg-[#f0f4ff] px-4">
                  <span className="shrink-0 text-[10px] font-semibold text-[#6366f1]">
                    {isPlaying ? '▶' : '■'} {Math.min(playbackIdx, playbackSteps.length)}/{playbackSteps.length}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ddd6fe]">
                    <div
                      className="h-full rounded-full bg-[#6366f1] transition-all duration-700"
                      style={{ width: `${(Math.min(playbackIdx, playbackSteps.length) / playbackSteps.length) * 100}%` }}
                    />
                  </div>
                  {playbackTimestamp && (
                    <span className="shrink-0 text-[10px] font-semibold text-[#1e293b]">{fmtDateTime(playbackTimestamp)}</span>
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="flex h-9 shrink-0 items-center gap-2 border-t border-[#e2e8f0] bg-white px-4">
                <span className="text-[10px] font-medium text-[#1e293b]">강수 단계:</span>
                {LEGEND.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="size-[9px] rounded-full" style={{ background: color }} />
                    <span className="text-[10px] text-[#475569]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col gap-2 md:gap-2.5 lg:w-[340px] lg:shrink-0 lg:overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-2.5 lg:grid-cols-1">

                <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3" style={{ animationDelay: '100ms' }}>
                  <p className="text-[11px] text-[#64748b] md:text-[12px]">서울시 평균 강수량</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="flex items-end gap-1.5">
                      <span className="text-[20px] font-bold text-[#3b82f6] md:text-[22px]">{avgRain}</span>
                      <span className="mb-0.5 text-[11px] text-[#64748b] md:text-[12px]">mm/hr</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#64748b] md:text-[11px]">▲ 3.2 전시간 대비</span>
                  </div>
                </div>

                <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3" style={{ animationDelay: '200ms' }}>
                  <p className="text-[11px] text-[#64748b] md:text-[12px]">최고 강수량 지역</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="flex items-end gap-1.5">
                      <span className="text-[20px] font-bold text-[#ed8936] md:text-[22px]">{maxRain.toFixed(1)}</span>
                      <span className="mb-0.5 text-[11px] text-[#64748b] md:text-[12px]">mm/hr ({maxDistrict})</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#64748b] md:text-[11px]">⚠ {getRainfallLevel(maxRain).label} 단계</span>
                  </div>
                </div>

                <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3" style={{ animationDelay: '300ms' }}>
                  <p className="text-[11px] text-[#64748b] md:text-[12px]">경보 발령 구</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="flex items-end gap-1.5">
                      <span className="text-[20px] font-bold text-[#e53e3e] md:text-[22px]">{alertCount}</span>
                      <span className="mb-0.5 text-[11px] text-[#64748b] md:text-[12px]">개구</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#64748b] md:text-[11px]">
                      {alertDistricts.map(([k]) => k.replace('구', '')).join('/')}
                    </span>
                  </div>
                </div>
              </div>

              {/* District Ranking */}
              <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white p-3 md:p-4" style={{ animationDelay: '400ms' }}>
                <p className="mb-2 text-[12px] font-semibold text-[#1e293b] md:text-[13px]">구별 강수량 순위 (Top 7)</p>
                <div className="flex flex-col gap-0.5">
                  {top7.map(([district, rain], i) => {
                    const level = getRainfallLevel(rain)
                    return (
                      <div key={district} className={`flex items-center rounded-[4px] px-2 py-1.5 md:py-2 ${i % 2 !== 0 ? 'bg-[#f9fbfe]' : ''}`}>
                        <span className="w-5 text-[12px] font-bold text-[#64748b] md:w-6 md:text-[13px]">{i + 1}</span>
                        <span className="w-16 text-[12px] font-medium text-[#1e293b] md:w-[72px] md:text-[13px]">{district}</span>
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
              <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white p-3 md:p-4" style={{ animationDelay: '500ms' }}>
                <p className="mb-2.5 text-[12px] font-semibold text-[#e53e3e] md:mb-3 md:text-[13px]">⚠&nbsp;&nbsp;경보 현황</p>
                <div className="flex flex-col gap-2">
                  {ALERTS.map((alert, i) => (
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
      </div>
    </div>
  )
}
