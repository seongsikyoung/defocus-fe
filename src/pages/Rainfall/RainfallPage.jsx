import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import polylabel from 'polylabel'
import { ROUTES } from '@/constants/routes'
import geoData from '../../../gu.json'

const MOCK_RAINFALL = {
  '도봉구': 8.5, '노원구': 13.1, '강북구': 9.2, '은평구': 5.7, '성북구': 18.6,
  '중랑구': 23.4, '서대문구': 7.3, '종로구': 15.2, '동대문구': 21.7, '광진구': 28.9,
  '마포구': 6.8, '용산구': 11.5, '중구': 14.3, '성동구': 26.4, '강동구': 20.1,
  '양천구': 4.3, '영등포구': 8.8, '동작구': 17.3, '서초구': 33.7, '강남구': 44.2,
  '강서구': 3.9, '구로구': 5.1, '관악구': 20.8, '금천구': 9.7, '송파구': 39.6,
}

function getRainfallLevel(mm) {
  if (mm >= 50) return { label: '위험', mapColor: '#1e3a8a', textColor: '#ffffff', badgeBg: '#1e3a8a', badgeText: '#ffffff' }
  if (mm >= 30) return { label: '경계', mapColor: '#2563eb', textColor: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' }
  if (mm >= 20) return { label: '주의', mapColor: '#60a5fa', textColor: '#1e293b', badgeBg: '#93c5fd', badgeText: '#1e3a8a' }
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
  { label: '종합', sub: '종합현황', active: false, route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황', active: true,  route: ROUTES.RAINFALL  },
  { label: '하천', sub: '하천수위', active: false, route: ROUTES.RIVER },
  { label: '하수', sub: '하수관로', active: false, route: ROUTES.SEWER },
  { label: 'AI',   sub: 'AI분석',   active: false, route: null },
]

const PERIODS = ['1시간', '3시간', '6시간', '12시간', '24시간']

const ALERTS = [
  { district: '강남구', type: '호우 경보', time: '14:20', desc: '시간당 44mm 이상 — 도심 침수 위험', severe: true },
  { district: '서초구', type: '호우 경보', time: '14:25', desc: '시간당 34mm — 배수불량 구간 침수', severe: true },
  { district: '송파구', type: '호우 주의보', time: '14:28', desc: '3시간 누적 62mm — 관심 필요', severe: false },
]

function SeoulMap({ rainfallData }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    const draw = () => {
      if (!svgRef.current || !containerRef.current) return
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const { width, height } = containerRef.current.getBoundingClientRect()
      if (!width || !height) return

      const projection = d3.geoMercator().fitSize([width, height], geoData)
      const pathGen = d3.geoPath().projection(projection)

      const districtG = svg.append('g').attr('class', 'districts')
      const labelG = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none')

      const paths = districtG.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).mapColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.2)
        .attr('cursor', 'pointer')
        .attr('opacity', 0)
        .attr('transform', 'translate(0,10)')
        .on('mousemove', function (event, d) {
          const [x, y] = d3.pointer(event, svgRef.current)
          const name = d.properties.name
          const rain = rainfallData[name] || 0
          d3.select(this).raise().attr('stroke', '#0ea5e9').attr('stroke-width', 2.5)
          setTooltip({ x, y, name, rain })
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke', 'white').attr('stroke-width', 1.2)
          setTooltip(null)
        })

      paths.transition()
        .duration(420)
        .ease(d3.easeCubicOut)
        .delay(d => {
          const b = pathGen.bounds(d)
          const cx = (b[0][0] + b[1][0]) / 2
          return 60 + (cx / width) * 560
        })
        .attr('opacity', 1)
        .attr('transform', 'translate(0,0)')

      const getLabelPoint = feature => {
        const project = coord => projection(coord)
        let rings
        if (feature.geometry.type === 'Polygon') {
          rings = feature.geometry.coordinates.map(ring => ring.map(project))
        } else {
          const largest = feature.geometry.coordinates.reduce((a, b) => {
            const aA = Math.abs(d3.polygonArea(a[0].map(project)))
            const bA = Math.abs(d3.polygonArea(b[0].map(project)))
            return aA >= bA ? a : b
          })
          rings = largest.map(ring => ring.map(project))
        }
        return polylabel(rings, 0.5)
      }
      const labelPts = new Map(geoData.features.map(f => [f, getLabelPoint(f)]))
      const cx = d => labelPts.get(d)[0]
      const cy = d => labelPts.get(d)[1]

      labelG.selectAll('text.dname')
        .data(geoData.features)
        .join('text')
        .attr('class', 'dname')
        .attr('x', cx)
        .attr('y', d => cy(d) - 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('font-weight', '600')
        .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => d.properties.name)

      labelG.selectAll('text.dval')
        .data(geoData.features)
        .join('text')
        .attr('class', 'dval')
        .attr('x', cx)
        .attr('y', d => cy(d) + 9)
        .attr('text-anchor', 'middle')
        .attr('font-size', '7px')
        .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => `${(rainfallData[d.properties.name] || 0).toFixed(1)}`)

      labelG.selectAll('text')
        .transition()
        .duration(300)
        .delay(700)
        .attr('opacity', 1)
    }

    draw()

    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [rainfallData])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full" style={{ overflow: 'hidden' }} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 400) - 130),
            top: Math.max(4, tooltip.y - 56),
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

export function RainfallPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('1시간')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const sortedByRain = Object.entries(MOCK_RAINFALL).sort(([, a], [, b]) => b - a)
  const top7 = sortedByRain.slice(0, 7)
  const avgRain = (
    Object.values(MOCK_RAINFALL).reduce((a, b) => a + b, 0) / Object.values(MOCK_RAINFALL).length
  ).toFixed(1)
  const [maxDistrict, maxRain] = sortedByRain[0]
  const alertDistricts = sortedByRain.filter(([, v]) => v >= 30)
  const alertCount = alertDistricts.length

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false })

  return (
    <div className="flex flex-col bg-[#f1f5f9] lg:h-screen lg:overflow-hidden">
      {/* Header */}
      <header className="grid h-14 shrink-0 grid-cols-[72px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
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
        {/* Sidebar */}
        <nav className="relative flex w-[72px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white">
          <div className="flex w-full flex-col">
            {NAV_ITEMS.map(({ label, sub, active, route }) => (
              <div
                key={label}
                onClick={() => route && navigate(route)}
                className={`relative flex w-full flex-col items-center py-3 md:py-4 ${
                  active ? 'bg-[rgba(185,217,254,0.4)]' : `${route ? 'cursor-pointer hover:bg-[#f1f5f9]' : ''}`
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-[#3b82f6]" />
                )}
                <span className={`text-[13px] md:text-[14px] ${active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#64748b]'}`}>
                  {label}
                </span>
                <span className={`text-[8px] md:text-[9px] ${active ? 'text-[#3b82f6]' : 'text-[#64748b]'}`}>
                  {sub}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex w-full cursor-pointer flex-col items-center py-3 hover:bg-[#f1f5f9] md:py-4">
            <span className="text-[13px] font-medium text-[#64748b] md:text-[14px]">설정</span>
            <span className="text-[8px] text-[#64748b] md:text-[9px]">설정</span>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:p-4 scrollbar-hide">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 md:h-10 md:flex-nowrap md:gap-3 md:px-4 md:py-0">
            <span className="shrink-0 text-[12px] font-medium text-[#64748b] md:text-[13px]">기간 선택:</span>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex h-7 w-14 items-center justify-center rounded-[6px] border text-[11px] font-medium transition-colors md:w-16 md:text-[12px] ${
                    period === p
                      ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                      : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="hidden flex-1 md:block" />
            <span className="hidden shrink-0 text-[12px] text-[#64748b] md:block">
              최종 갱신: {timeStr}&nbsp;&nbsp;(10분 단위 갱신)
            </span>
          </div>

          {/* Main Row */}
          <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">
            {/* Map Panel */}
            <div className="flex h-[360px] flex-col overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white md:h-[440px] lg:h-auto lg:min-h-0 lg:flex-1">
              <div className="flex h-12 shrink-0 items-center px-4">
                <span className="text-[14px] font-semibold text-[#1e293b] md:text-[15px]">서울시 구별 강수량 현황</span>
                <span className="ml-2 text-[11px] text-[#64748b] md:text-[12px]"> 단위: mm/hr</span>
              </div>
              <div className="h-px shrink-0 bg-[#e2e8f0]" />
              <div className="relative min-h-0 flex-1 bg-[#f7fbff]">
                <SeoulMap rainfallData={MOCK_RAINFALL} />
              </div>
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
              {/* KPI Cards — 1 col mobile, 3 col sm~md, 1 col lg+ */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-2.5 lg:grid-cols-1">
                {/* KPI 1 */}
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

                {/* KPI 2 */}
                <div className="animate-slide-up rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3" style={{ animationDelay: '200ms' }}>
                  <p className="text-[11px] text-[#64748b] md:text-[12px]">최고 강수량 지역</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="flex items-end gap-1.5">
                      <span className="text-[20px] font-bold text-[#ed8936] md:text-[22px]">{maxRain.toFixed(1)}</span>
                      <span className="mb-0.5 text-[11px] text-[#64748b] md:text-[12px]">mm/hr ({maxDistrict})</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#64748b] md:text-[11px]">
                      ⚠ {getRainfallLevel(maxRain).label} 단계
                    </span>
                  </div>
                </div>

                {/* KPI 3 */}
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
                      <div
                        key={district}
                        className={`flex items-center rounded-[4px] px-2 py-1.5 md:py-2 ${i % 2 !== 0 ? 'bg-[#f9fbfe]' : ''}`}
                      >
                        <span className="w-5 text-[12px] font-bold text-[#64748b] md:w-6 md:text-[13px]">{i + 1}</span>
                        <span className="w-16 text-[12px] font-medium text-[#1e293b] md:w-[72px] md:text-[13px]">{district}</span>
                        <span className="flex-1 text-[12px] font-medium md:text-[13px]" style={{ color: level.badgeText }}>
                          {rain.toFixed(1)} mm/hr
                        </span>
                        <span
                          className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:text-[11px]"
                          style={{ background: level.badgeBg, color: level.badgeText }}
                        >
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
                    <div
                      key={i}
                      className="rounded-[6px] px-3 py-2"
                      style={{ background: alert.severe ? '#fff0f0' : '#fff7e5' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12px] font-semibold md:text-[13px]"
                          style={{ color: alert.severe ? '#b81515' : '#8c520a' }}
                        >
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
