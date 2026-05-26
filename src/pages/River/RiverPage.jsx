import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// ── Mock data (replace with API calls) ──────────────────────────────────────
const MOCK_STATIONS = [
  { id: 1, name: '중랑천(망우)', lat: 37.5921, lng: 127.0857, riverBed: 12.5, plannedFlood: 18.0, embankment: 20.5, current: 17.2, trend: 'rising' },
  { id: 2, name: '한강(광진)', lat: 37.5389, lng: 127.0830, riverBed: 3.1, plannedFlood: 10.5, embankment: 12.0, current: 11.3, trend: 'rising' },
  { id: 3, name: '탄천(성남)', lat: 37.4383, lng: 127.1324, riverBed: 6.2, plannedFlood: 12.0, embankment: 14.5, current: 7.5, trend: 'stable' },
  { id: 4, name: '안양천(광명)', lat: 37.4489, lng: 126.8659, riverBed: 4.8, plannedFlood: 9.5, embankment: 11.0, current: 5.2, trend: 'falling' },
  { id: 5, name: '청계천(성동)', lat: 37.5683, lng: 127.0183, riverBed: 8.3, plannedFlood: 11.0, embankment: 12.5, current: 9.8, trend: 'rising' },
  { id: 6, name: '홍제천(서대문)', lat: 37.5752, lng: 126.9380, riverBed: 15.2, plannedFlood: 20.0, embankment: 22.0, current: 16.1, trend: 'stable' },
  { id: 7, name: '불광천(은평)', lat: 37.6013, lng: 126.9282, riverBed: 18.5, plannedFlood: 23.5, embankment: 25.0, current: 19.2, trend: 'stable' },
]

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황', active: false, route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황', active: false, route: ROUTES.RAINFALL },
  { label: '하천', sub: '하천수위', active: true,  route: ROUTES.RIVER },
  { label: '하수', sub: '하수관로', active: false, route: ROUTES.SEWER },
  { label: 'AI',   sub: 'AI분석',   active: false, route: null },
]

// ── Status helper ────────────────────────────────────────────────────────────
function getStatus(s) {
  if (s.current >= s.embankment)              return { level: 'flood',  label: '범람 임박', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (s.current >= s.plannedFlood)            return { level: 'danger', label: '위험',    color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (s.current >= s.plannedFlood * 0.75)     return { level: 'caution',label: '주의',    color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                                              { level: 'normal', label: '정상',    color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

// ── Water Gauge SVG ──────────────────────────────────────────────────────────
function RiverGauge({ station }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [station.id])

  const { riverBed, plannedFlood, embankment, current } = station
  const status = getStatus(station)

  // SVG coordinate system
  const SVG_W = 300
  const SVG_H = 220
  const PAD_T = 20  // top padding (above embankment)
  const PAD_B = 20  // bottom padding (below riverbed)
  const PAD_L = 68  // left (for Y-axis labels)
  const PAD_R = 12

  const chartTop = PAD_T
  const chartBot = SVG_H - PAD_B
  const chartH   = chartBot - chartTop
  const chartL   = PAD_L
  const chartR   = SVG_W - PAD_R

  const range = embankment - riverBed

  // value → SVG Y (embankment = top, riverBed = bottom)
  const toY = (v) => chartTop + chartH - ((v - riverBed) / range) * chartH

  const bankY    = toY(embankment)   // = chartTop
  const bedY     = toY(riverBed)     // = chartBot
  const floodY   = toY(plannedFlood)
  const currentY = toY(current)

  // Channel trapezoid: sloped banks
  const slopeW = 22
  const channelPts = [
    [chartL,          bankY],
    [chartL + slopeW, bedY],
    [chartR - slopeW, bedY],
    [chartR,          bankY],
  ]
  const channelD = channelPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')

  // Water fill: from riverBed up to current (animated with CSS)
  const waterH   = animated ? (bedY - currentY) : 0
  const waterTopY = animated ? currentY : bedY


  const waterColor  = status.level === 'flood' ? '#f34236' : status.level === 'danger' ? '#fe9600' : status.level === 'caution' ? '#f5c518' : '#3b82f6'
  const waterLight  = status.level === 'flood' ? '#fca5a5' : status.level === 'danger' ? '#fcd34d' : status.level === 'caution' ? '#fde68a' : '#93c5fd'

  const gradId = `water-grad-${station.id}`
  const clipId = `channel-clip-${station.id}`

  // Left-side label helper
  const Label = ({ value, label, color, dash }) => {
    const y = toY(value)
    if (y < chartTop - 2 || y > chartBot + 2) return null
    return (
      <g>
        <line x1={chartL - 2} y1={y} x2={chartR} y2={y}
          stroke={color} strokeWidth={1.2}
          strokeDasharray={dash ? '5 3' : undefined}
          opacity={0.7} />
        <text x={chartL - 6} y={y + 4} textAnchor="end"
          fontSize={8.5} fill={color} fontWeight="600">
          {label}
        </text>
        <text x={chartL - 6} y={y + 13} textAnchor="end"
          fontSize={7.5} fill={color} opacity={0.75}>
          {value.toFixed(1)}m
        </text>
      </g>
    )
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={waterColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={waterLight} stopOpacity="0.4" />
          </linearGradient>
          <clipPath id={clipId}>
            <polygon points={channelPts.map(p => p.join(',')).join(' ')} />
          </clipPath>
        </defs>

        {/* Channel silhouette (earth/bed) */}
        <polygon
          points={channelPts.map(p => p.join(',')).join(' ')}
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Riverbed texture */}
        <rect
          x={chartL + slopeW} y={bedY - 5}
          width={chartR - chartL - slopeW * 2} height={6}
          fill="#b0bec5" rx={1}
          clipPath={`url(#${clipId})`}
        />

        {/* Water fill */}
        <rect
          x={0} y={waterTopY}
          width={SVG_W} height={waterH + 10}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
          style={{ transition: 'height 1.2s cubic-bezier(0.34,1.56,0.64,1), y 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />

        {/* Water surface line — clipped to channel walls automatically */}
        <line
          x1={chartL} y1={currentY}
          x2={chartR} y2={currentY}
          stroke={waterColor} strokeWidth={1.5} opacity={0.3}
          clipPath={`url(#${clipId})`}
        />

        {/* Channel outline on top */}
        <path d={channelD} fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinejoin="round" />

        {/* Reference lines */}
        <Label value={embankment}   label="제방고"    color="#f34236" dash={false} />
        <Label value={plannedFlood} label="계획홍수위" color="#fe9600" dash={true}  />
        <Label value={riverBed}     label="하상고"    color="#94a3b8" dash={false} />

        {/* Current level highlight */}
        {animated && (
          <g>
            <line
              x1={chartL + slopeW + 2} y1={currentY}
              x2={chartR - slopeW - 2} y2={currentY}
              stroke={waterColor} strokeWidth={2} opacity={0.95}
            />
            <text x={chartR - slopeW + 2} y={currentY + 4}
              fontSize={8} fill={waterColor} fontWeight="700">
              현재
            </text>
          </g>
        )}

        {/* Bubble markers for top labels */}
        <g>
          {[{ y: bankY, color: '#f34236' }, { y: floodY, color: '#fe9600' }].map(({ y, color }, i) => (
            <circle key={i} cx={chartR + 4} cy={y} r={3} fill={color} opacity={0.8} />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Station Detail Panel ─────────────────────────────────────────────────────
function StationPanel({ station }) {
  const status = getStatus(station)
  const depth  = (station.current - station.riverBed).toFixed(2)
  const toFlood = (station.plannedFlood - station.current).toFixed(2)
  const trendIcon = station.trend === 'rising' ? '↑' : station.trend === 'falling' ? '↓' : '→'
  const trendColor = station.trend === 'rising' ? '#f34236' : station.trend === 'falling' ? '#3b82f6' : '#64748b'

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-hide">
      {/* Station header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8]">수위 관측소</p>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#1e293b]">{station.name}</h2>
          </div>
          <span
            className="rounded-[7px] px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0]" />

      {/* Water gauge */}
      <div className="shrink-0 px-4 py-4">
        <p className="mb-2 text-[11px] font-semibold text-[#64748b]">하천 수위 단면도</p>
        <RiverGauge station={station} />
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0]" />

      {/* Key metrics */}
      <div className="shrink-0 px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold text-[#64748b]">주요 수치 (EL.m)</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '실시간 수위', value: `${station.current.toFixed(2)} m`, color: '#3b82f6', highlight: true },
            { label: '현재 수심',   value: `${depth} m`,   color: '#1e293b' },
            { label: '제방고',     value: `${station.embankment.toFixed(1)} m`,    color: '#f34236' },
            { label: '계획홍수위', value: `${station.plannedFlood.toFixed(1)} m`,  color: '#fe9600' },
            { label: '하상고',     value: `${station.riverBed.toFixed(1)} m`,      color: '#94a3b8' },
            { label: '여유고',     value: `${toFlood > 0 ? '+' : ''}${toFlood} m`, color: toFlood < 0 ? '#f34236' : '#24c552' },
          ].map(({ label, value, color, highlight }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-[8px] border bg-[#f8fafc] px-3 py-2.5"
              style={{ borderColor: highlight ? `${color}40` : '#e2e8f0' }}
            >
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
              <span className="text-[15px] font-bold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="mx-5 mb-5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#64748b]">수위 추이</span>
          <span className="text-[13px] font-bold" style={{ color: trendColor }}>
            {trendIcon}&nbsp;{station.trend === 'rising' ? '상승 중' : station.trend === 'falling' ? '하강 중' : '안정'}
          </span>
        </div>
        {status.level !== 'normal' && (
          <p className="mt-2 text-[11px] leading-5 text-[#f34236]">
            {status.level === 'flood'
              ? '⚠ 제방고 초과 — 즉시 대피 및 현장 조치 필요'
              : '주의: 계획홍수위 도달. 지속 모니터링 필요.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Kakao Map ────────────────────────────────────────────────────────────────
function KakaoMap({ stations, selectedId, onSelect }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const overlaysRef  = useRef([])

  useEffect(() => {
    const KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!KEY || !containerRef.current) return

    const initMap = () => {
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(37.54, 127.0),
        level: 9,
      })
      mapRef.current = map

      // Clean previous overlays
      overlaysRef.current.forEach(o => o.setMap(null))
      overlaysRef.current = []

      stations.forEach(station => {
        const st = getStatus(station)

        const div = document.createElement('div')
        div.style.cssText = `
          display:flex; flex-direction:column; align-items:center;
          cursor:pointer; transform:translateY(-100%);
        `
        div.innerHTML = `
          <div style="
            background:${st.color}; color:#fff;
            font-size:11px; font-weight:700;
            padding:4px 9px; border-radius:20px;
            white-space:nowrap; box-shadow:0 2px 8px ${st.color}55;
            border:2px solid #fff;
            transition:transform 0.15s;
          ">${station.name}</div>
          <div style="
            width:0; height:0;
            border-left:5px solid transparent;
            border-right:5px solid transparent;
            border-top:7px solid ${st.color};
            margin-top:-1px;
          "></div>
        `
        div.addEventListener('click', () => onSelect(station))
        div.addEventListener('mouseenter', () => {
          div.querySelector('div').style.transform = 'scale(1.08)'
        })
        div.addEventListener('mouseleave', () => {
          div.querySelector('div').style.transform = 'scale(1)'
        })

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(station.lat, station.lng),
          content: div,
          yAnchor: 1,
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    }

    if (window.kakao?.maps) {
      initMap()
    } else {
      const existing = document.getElementById('kakao-maps-sdk')
      if (existing) {
        existing.onload = () => window.kakao.maps.load(initMap)
        return
      }
      const script = document.createElement('script')
      script.id  = 'kakao-maps-sdk'
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
      script.async = true
      script.onload = () => window.kakao.maps.load(initMap)
      document.head.appendChild(script)
    }

    return () => {
      overlaysRef.current.forEach(o => o.setMap(null))
    }
  }, [stations])

  const noKey = !import.meta.env.VITE_KAKAO_MAP_KEY

  return (
    <div className="relative h-full w-full bg-[#e8eef5]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Fallback when no API key */}
      {noKey && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#e8eef5]">
          {/* Placeholder grid lines */}
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
          </svg>

          {/* Station dots on placeholder */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[#475569]">카카오맵을 표시하려면</p>
            <code className="rounded-md bg-white px-3 py-1.5 text-[12px] text-[#3b82f6] shadow">
              VITE_KAKAO_MAP_KEY=발급받은키
            </code>
            <p className="text-[12px] text-[#94a3b8]">.env 파일에 추가해주세요</p>
          </div>

          {/* Still show clickable station list */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {stations.map(s => {
              const st = getStatus(s)
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[11px] font-medium shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: `${st.color}40`, color: st.color }}
                >
                  <span className="size-[6px] rounded-full" style={{ background: st.color }} />
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function RiverPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr   = now.toLocaleTimeString('ko-KR', { hour12: false })
  const alertCnt  = MOCK_STATIONS.filter(s => getStatus(s).level !== 'normal').length

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f5f9]">

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
            <span className="text-[11px] font-medium text-[#cc1a1a]">경보 {alertCnt}건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] sm:block">{timeStr}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        {/* Left nav */}
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

        {/* Content */}
        <div className="flex min-h-0 flex-1">

          {/* Map area */}
          <div className="relative min-h-0 flex-1">
            <KakaoMap
              stations={MOCK_STATIONS}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />

            {/* Station status summary bar */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {MOCK_STATIONS.map(s => {
                const st = getStatus(s)
                const isSelected = selected?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s)}
                    className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-semibold shadow-sm transition-all hover:scale-105"
                    style={{
                      borderColor: st.color,
                      background: isSelected ? st.color : 'rgba(255,255,255,0.92)',
                      color: isSelected ? '#fff' : st.color,
                    }}
                  >
                    <span className="size-[5px] rounded-full" style={{ background: isSelected ? '#fff' : st.color }} />
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right detail panel */}
          <div
            className="h-full shrink-0 overflow-hidden border-l border-[#e2e8f0] bg-white transition-all duration-300"
            style={{ width: selected ? 340 : 0 }}
          >
            {selected && <StationPanel key={selected.id} station={selected} />}
          </div>

          {/* Prompt when nothing selected */}
          {!selected && (
            <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M15 10l-4 4m0 0l-4-4m4 4V3M3 17v1a2 2 0 002 2h14a2 2 0 002-2v-1" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[12px] text-[#94a3b8]">관측소를 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
