import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { SettingsPanel } from '@/components/SettingsPanel'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_RIVER_STATIONS = [
  { id: 'r1', type: 'river', name: '중랑천(망우)',   lat: 37.5921, lng: 127.0857, riverBed: 12.5, plannedFlood: 18.0, embankment: 20.5, current: 17.2, trend: 'rising'  },
  { id: 'r2', type: 'river', name: '한강(광진)',     lat: 37.5389, lng: 127.0830, riverBed: 3.1,  plannedFlood: 10.5, embankment: 12.0, current: 11.3, trend: 'rising'  },
  { id: 'r3', type: 'river', name: '탄천(성남)',     lat: 37.4383, lng: 127.1324, riverBed: 6.2,  plannedFlood: 12.0, embankment: 14.5, current: 7.5,  trend: 'stable'  },
  { id: 'r4', type: 'river', name: '안양천(광명)',   lat: 37.4489, lng: 126.8659, riverBed: 4.8,  plannedFlood: 9.5,  embankment: 11.0, current: 5.2,  trend: 'falling' },
  { id: 'r5', type: 'river', name: '청계천(성동)',   lat: 37.5683, lng: 127.0183, riverBed: 8.3,  plannedFlood: 11.0, embankment: 12.5, current: 9.8,  trend: 'rising'  },
  { id: 'r6', type: 'river', name: '홍제천(서대문)', lat: 37.5752, lng: 126.9380, riverBed: 15.2, plannedFlood: 20.0, embankment: 22.0, current: 16.1, trend: 'stable'  },
  { id: 'r7', type: 'river', name: '불광천(은평)',   lat: 37.6013, lng: 126.9282, riverBed: 18.5, plannedFlood: 23.5, embankment: 25.0, current: 19.2, trend: 'stable'  },
]

const MOCK_SEWER_STATIONS = [
  { id: 's1', type: 'sewer', name: '강남구 역삼동',   lat: 37.4994, lng: 127.0349, fill: 0.87, diameter: 800, location: '역삼로 37길'   },
  { id: 's2', type: 'sewer', name: '서초구 반포동',   lat: 37.5037, lng: 126.9988, fill: 0.65, diameter: 600, location: '반포대로 55'   },
  { id: 's3', type: 'sewer', name: '관악구 신림동',   lat: 37.4843, lng: 126.9294, fill: 0.92, diameter: 500, location: '신림로 23'     },
  { id: 's4', type: 'sewer', name: '동작구 노량진',   lat: 37.5149, lng: 126.9396, fill: 0.38, diameter: 700, location: '노량진로 48'   },
  { id: 's5', type: 'sewer', name: '영등포구 여의도', lat: 37.5219, lng: 126.9245, fill: 0.73, diameter: 900, location: '여의도동 35-1' },
  { id: 's6', type: 'sewer', name: '마포구 합정동',   lat: 37.5498, lng: 126.9139, fill: 0.45, diameter: 450, location: '합정로 22'     },
  { id: 's7', type: 'sewer', name: '성동구 성수동',   lat: 37.5443, lng: 127.0557, fill: 1.0,  diameter: 600, location: '성수이로 5'    },
]

const ALL_STATIONS = [...MOCK_RIVER_STATIONS, ...MOCK_SEWER_STATIONS]

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황',    active: false, route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황',    active: false, route: ROUTES.RAINFALL  },
  { label: '수위', sub: '하천·하수관', active: true,  route: ROUTES.RIVER     },
]

// ── Status helpers ────────────────────────────────────────────────────────────
function getRiverStatus(s) {
  if (s.current >= s.embankment)          return { level: 'flood',   label: '범람 임박', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (s.current >= s.plannedFlood)        return { level: 'danger',  label: '위험',      color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (s.current >= s.plannedFlood * 0.75) return { level: 'caution', label: '주의',      color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                                          { level: 'normal',  label: '정상',      color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

function getSewerStatus(fill) {
  if (fill >= 1.0) return { level: 'full',    label: '만수 · 역류', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (fill >= 0.8) return { level: 'danger',  label: '위험',        color: '#f34236', bg: 'rgba(243,66,54,0.10)',  dot: '#f34236' }
  if (fill >= 0.7) return { level: 'warning', label: '경계',        color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (fill >= 0.5) return { level: 'caution', label: '주의',        color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                   { level: 'normal',  label: '정상',        color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

function getStationStatus(station) {
  return station.type === 'river' ? getRiverStatus(station) : getSewerStatus(station.fill)
}

const SEWER_REF_LINES = [
  { f: 0.5, color: '#24c552', label: '50%' },
  { f: 0.7, color: '#f5c518', label: '70%' },
  { f: 0.8, color: '#fe9600', label: '80%' },
]

// ── Inline SVG icon strings for Kakao overlay (must be HTML strings) ──────────
const RIVER_ICON_SVG = `<svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:5px;flex-shrink:0;display:block;">
  <path d="M0.5 6.5 Q2.2 3 3.8 6.5 Q5.4 10 7 6.5 Q8.6 3 10.2 6.5 Q11.8 10 13.5 6.5" stroke="rgba(255,255,255,0.92)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M1 3 Q2.5 0.5 4 3 Q5.5 5.5 7 3 Q8.5 0.5 10 3" stroke="rgba(255,255,255,0.45)" stroke-width="1.1" stroke-linecap="round" fill="none"/>
</svg>`

const SEWER_ICON_SVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:5px;flex-shrink:0;display:block;">
  <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.92)" stroke-width="1.6"/>
  <circle cx="6.5" cy="6.5" r="2.1" stroke="rgba(255,255,255,0.5)" stroke-width="1.1"/>
  <circle cx="6.5" cy="6.5" r="0.8" fill="rgba(255,255,255,0.55)"/>
</svg>`

// ── River Gauge SVG ───────────────────────────────────────────────────────────
function RiverGauge({ station }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [station.id])

  const { riverBed, plannedFlood, embankment, current } = station
  const status = getRiverStatus(station)

  const SVG_W = 300, SVG_H = 220
  const PAD_T = 20, PAD_B = 20, PAD_L = 68, PAD_R = 12
  const chartTop = PAD_T, chartBot = SVG_H - PAD_B
  const chartH = chartBot - chartTop
  const chartL = PAD_L, chartR = SVG_W - PAD_R
  const range = embankment - riverBed
  const toY = (v) => chartTop + chartH - ((v - riverBed) / range) * chartH

  const bankY = toY(embankment), bedY = toY(riverBed)
  const floodY = toY(plannedFlood), currentY = toY(current)
  const slopeW = 22
  const channelPts = [
    [chartL,          bankY],
    [chartL + slopeW, bedY],
    [chartR - slopeW, bedY],
    [chartR,          bankY],
  ]
  const channelD = channelPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')

  const waterH    = animated ? (bedY - currentY) : 0
  const waterTopY = animated ? currentY : bedY
  const waterColor = status.level === 'flood' ? '#f34236' : status.level === 'danger' ? '#fe9600' : status.level === 'caution' ? '#f5c518' : '#3b82f6'
  const waterLight = status.level === 'flood' ? '#fca5a5' : status.level === 'danger' ? '#fcd34d' : status.level === 'caution' ? '#fde68a' : '#93c5fd'

  const gradId = `water-grad-${station.id}`
  const clipId = `channel-clip-${station.id}`

  const Label = ({ value, label, color, dash }) => {
    const y = toY(value)
    if (y < chartTop - 2 || y > chartBot + 2) return null
    return (
      <g>
        <line x1={chartL - 2} y1={y} x2={chartR} y2={y}
          stroke={color} strokeWidth={1.2} strokeDasharray={dash ? '5 3' : undefined} opacity={0.7} />
        <text x={chartL - 6} y={y + 4} textAnchor="end" fontSize={8.5} fill={color} fontWeight="600">{label}</text>
        <text x={chartL - 6} y={y + 13} textAnchor="end" fontSize={7.5} fill={color} opacity={0.75}>{value.toFixed(1)}m</text>
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

        <polygon points={channelPts.map(p => p.join(',')).join(' ')}
          fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.5} strokeLinejoin="round" />
        <rect x={chartL + slopeW} y={bedY - 5}
          width={chartR - chartL - slopeW * 2} height={6}
          fill="#b0bec5" rx={1} clipPath={`url(#${clipId})`} />
        <rect x={0} y={waterTopY} width={SVG_W} height={waterH + 10}
          fill={`url(#${gradId})`} clipPath={`url(#${clipId})`}
          style={{ transition: 'height 1.2s cubic-bezier(0.34,1.56,0.64,1), y 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <line x1={chartL} y1={currentY} x2={chartR} y2={currentY}
          stroke={waterColor} strokeWidth={1.5} opacity={0.3} clipPath={`url(#${clipId})`} />
        <path d={channelD} fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinejoin="round" />

        <Label value={embankment}   label="제방고"    color="#f34236" dash={false} />
        <Label value={plannedFlood} label="계획홍수위" color="#fe9600" dash={true}  />
        <Label value={riverBed}     label="하상고"    color="#94a3b8" dash={false} />

        {animated && (() => {
          // 수위 위치 비율 (0 = 하상고, 1 = 제방고)
          const frac = Math.min(Math.max((bedY - currentY) / (bedY - bankY), 0), 1)
          const lx = chartL + slopeW * (1 - frac) + 2
          const rx = chartR - slopeW * (1 - frac) - 2
          return (
            <g>
              <line x1={lx} y1={currentY} x2={rx} y2={currentY}
                stroke={waterColor} strokeWidth={2} opacity={0.95} />
              <text x={rx + 2} y={currentY + 4} fontSize={8} fill={waterColor} fontWeight="700">현재</text>
            </g>
          )
        })()}
        <g>
          {[{ y: bankY, color: '#f34236' }, { y: floodY, color: '#fe9600' }].map(({ y, color }, i) => (
            <circle key={i} cx={chartR + 4} cy={y} r={3} fill={color} opacity={0.8} />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Pipe Gauge SVG ────────────────────────────────────────────────────────────
function PipeGauge({ station }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [station.id])

  const { fill } = station
  const status = getSewerStatus(fill)
  const SVG_W = 260, SVG_H = 260
  const cx = SVG_W / 2, cy = SVG_H / 2
  const R = 95, WALL = 10

  const displayFill = animated ? fill : 0
  const waterY = cy + R - displayFill * 2 * R
  const waterH = displayFill * 2 * R + 12

  const waterColor = (status.level === 'full' || status.level === 'danger') ? '#f34236'
    : status.level === 'warning' ? '#fe9600'
    : status.level === 'caution' ? '#f5c518'
    : '#3b82f6'
  const waterLight = (status.level === 'full' || status.level === 'danger') ? '#fca5a5'
    : status.level === 'warning' ? '#fed7aa'
    : status.level === 'caution' ? '#fef08a'
    : '#93c5fd'

  const gradId     = `sewer-grad-${station.id}`
  const clipId     = `pipe-clip-${station.id}`
  const wallGradId = `wall-grad-${station.id}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1">
        <span className="text-[32px] font-bold leading-none" style={{ color: status.color }}>
          {Math.round(fill * 100)}
        </span>
        <span className="mb-1 text-[14px] text-[#94a3b8]">%</span>
        <span className="mb-0.5 ml-2 text-[13px] font-medium" style={{ color: status.color }}>{status.label}</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={waterColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={waterLight}  stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={wallGradId} cx="38%" cy="32%" r="62%" fx="38%" fy="32%">
            <stop offset="0%"   stopColor="#d1d9e0" />
            <stop offset="60%"  stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <clipPath id={clipId}><circle cx={cx} cy={cy} r={R} /></clipPath>
        </defs>

        <circle cx={cx} cy={cy} r={R + WALL}     fill="#475569" />
        <circle cx={cx} cy={cy} r={R + WALL - 2} fill={`url(#${wallGradId})`} />
        <circle cx={cx} cy={cy} r={R}             fill="#1e293b" />

        <g clipPath={`url(#${clipId})`} opacity="0.06">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`}
              x1={cx - R + i * (2 * R / 7)} y1={cy - R}
              x2={cx - R + i * (2 * R / 7)} y2={cy + R}
              stroke="#fff" strokeWidth="1"
            />
          ))}
        </g>

        <rect x={cx - R - 2} y={waterY} width={2 * R + 4} height={waterH}
          fill={`url(#${gradId})`} clipPath={`url(#${clipId})`}
          style={{ transition: 'y 1.1s cubic-bezier(0.34,1.56,0.64,1), height 1.1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />

        {animated && displayFill > 0.02 && (
          <line x1={cx - R} y1={waterY} x2={cx + R} y2={waterY}
            stroke="#fff" strokeWidth={1.5} opacity={0.35} clipPath={`url(#${clipId})`} />
        )}

        {SEWER_REF_LINES.map(({ f, color }) => {
          const refY = cy + R - f * 2 * R
          return (
            <line key={f} x1={cx - R} y1={refY} x2={cx + R} y2={refY}
              stroke={color} strokeWidth={1} strokeDasharray="5 3" opacity={0.55}
              clipPath={`url(#${clipId})`} />
          )
        })}
        {SEWER_REF_LINES.map(({ f, color, label }) => {
          const refY = cy + R - f * 2 * R
          return (
            <text key={f} x={cx + R + 8} y={refY + 4} fontSize={9} fill={color} fontWeight="600" opacity={0.85}>
              {label}
            </text>
          )
        })}

        <circle cx={cx} cy={cy} r={R} fill="none" stroke="white" strokeWidth={1.5} opacity={0.1} />

        {fill >= 1.0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect x={cx - R} y={cy - R} width={2 * R} height={R * 0.3} fill="rgba(243,66,54,0.25)" />
            <text x={cx} y={cy - R + 18} textAnchor="middle" fontSize={10} fill="#f34236" fontWeight="700" opacity={0.9}>
              역류 발생
            </text>
          </g>
        )}

        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const bx  = cx + (R + WALL - 4) * Math.cos(rad)
          const by  = cy + (R + WALL - 4) * Math.sin(rad)
          return <circle key={deg} cx={bx} cy={by} r={2.5} fill="#334155" />
        })}
      </svg>
    </div>
  )
}

// ── River Station Panel ───────────────────────────────────────────────────────
function RiverStationPanel({ station }) {
  const status     = getRiverStatus(station)
  const depth      = (station.current - station.riverBed).toFixed(2)
  const toFlood    = (station.plannedFlood - station.current).toFixed(2)
  const trendIcon  = station.trend === 'rising' ? '↑' : station.trend === 'falling' ? '↓' : '→'
  const trendColor = station.trend === 'rising' ? '#f34236' : station.trend === 'falling' ? '#3b82f6' : '#64748b'

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-hide">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8]">하천 수위 관측소</p>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#1e293b] dark:text-[#e2e8f0]">{station.name}</h2>
          </div>
          <span className="shrink-0 rounded-[7px] px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />

      <div className="shrink-0 px-4 py-4">
        <p className="mb-2 text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">하천 수위 단면도</p>
        <RiverGauge station={station} />
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />

      <div className="shrink-0 px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">주요 수치 (EL.m)</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '실시간 수위', value: `${station.current.toFixed(2)} m`,              color: '#3b82f6', highlight: true },
            { label: '현재 수심',   value: `${depth} m`,                                    color: '#1e293b', neutral: true },
            { label: '제방고',      value: `${station.embankment.toFixed(1)} m`,             color: '#f34236' },
            { label: '계획홍수위',  value: `${station.plannedFlood.toFixed(1)} m`,            color: '#fe9600' },
            { label: '하상고',      value: `${station.riverBed.toFixed(1)} m`,                color: '#94a3b8' },
            { label: '여유고',      value: `${toFlood > 0 ? '+' : ''}${toFlood} m`,           color: toFlood < 0 ? '#f34236' : '#24c552' },
          ].map(({ label, value, color, highlight, neutral }) => (
            <div key={label}
              className="flex flex-col gap-1 rounded-[8px] border bg-[#f8fafc] px-3 py-2.5 dark:bg-[#111d35]"
              style={{ borderColor: highlight ? `${color}40` : '#e2e8f0' }}>
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
              {neutral
                ? <span className="text-[15px] font-bold text-[#1e293b] dark:text-[#e2e8f0]">{value}</span>
                : <span className="text-[15px] font-bold" style={{ color }}>{value}</span>
              }
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 dark:border-[#2d3f5e] dark:bg-[#111d35]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">수위 추이</span>
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

// ── Sewer Station Panel ───────────────────────────────────────────────────────
function SewerStationPanel({ station }) {
  const status        = getSewerStatus(station.fill)
  const backflow      = station.fill >= 0.8 ? '높음' : station.fill >= 0.5 ? '보통' : '낮음'
  const backflowColor = station.fill >= 0.8 ? '#f34236' : station.fill >= 0.5 ? '#fe9600' : '#24c552'

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-hide">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8]">하수관로 관측소</p>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#1e293b] dark:text-[#e2e8f0]">{station.name}</h2>
            <p className="mt-0.5 text-[11px] text-[#94a3b8]">{station.location}</p>
          </div>
          <span className="shrink-0 rounded-[7px] px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />

      <div className="shrink-0 px-5 py-4">
        <p className="mb-2 text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">관로 충만도 단면</p>
        <PipeGauge station={station} />
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />

      <div className="shrink-0 px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold text-[#64748b] dark:text-[#94a3b8]">주요 지표</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '충만도',    value: `${(station.fill * 100).toFixed(1)}%`, color: status.color, highlight: true },
            { label: '관로 직경', value: `${station.diameter} mm`,              color: '#1e293b', neutral: true },
            { label: '역류 위험', value: backflow,                              color: backflowColor },
            { label: '기준 상태', value: station.fill >= 0.8 ? '즉시 조치' : station.fill >= 0.5 ? '모니터링' : '이상 없음', color: status.color },
          ].map(({ label, value, color, highlight, neutral }) => (
            <div key={label}
              className="flex flex-col gap-1 rounded-[8px] border bg-[#f8fafc] px-3 py-2.5 dark:bg-[#111d35]"
              style={{ borderColor: highlight ? `${color}40` : '#e2e8f0' }}>
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
              {neutral
                ? <span className="text-[15px] font-bold text-[#1e293b] dark:text-[#e2e8f0]">{value}</span>
                : <span className="text-[15px] font-bold" style={{ color }}>{value}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {station.fill >= 0.7 && (
        <div className="mx-5 mb-5 rounded-[10px] border px-4 py-3"
          style={{ borderColor: `${status.color}40`, background: status.bg }}>
          <p className="text-[11px] font-semibold" style={{ color: status.color }}>
            {station.fill >= 1.0
              ? '🔴 만수 — 역류 발생 중. 즉시 현장 점검 필요.'
              : station.fill >= 0.8
              ? '⚠ 위험 — 역류 가능성 높음. 배수 조치 요망.'
              : '주의: 경계 수준. 지속 모니터링 권고.'}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Unified Kakao Map ─────────────────────────────────────────────────────────
function KakaoMap({ stations, onSelect }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const overlaysRef  = useRef([])
  const stationsRef  = useRef(stations)
  const onSelectRef  = useRef(onSelect)

  useEffect(() => { stationsRef.current = stations }, [stations])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  function drawMarkers(map, stationList) {
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    stationList.forEach(station => {
      const isRiver = station.type === 'river'
      const st      = getStationStatus(station)
      const icon    = isRiver ? RIVER_ICON_SVG : SEWER_ICON_SVG
      const tail    = isRiver
        ? `<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${st.color};margin-top:-1px;"></div>`
        : `<div style="width:7px;height:7px;border-radius:50%;background:${st.color};margin-top:3px;border:2px solid #fff;box-shadow:0 1px 5px ${st.color}99;"></div>`

      const div = document.createElement('div')
      div.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translateY(-100%);'
      div.innerHTML = `
        <div style="display:flex;align-items:center;background:${st.color};color:#fff;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 10px ${st.color}66;border:2px solid #fff;transition:transform 0.15s;">
          ${icon}${station.name}
        </div>
        ${tail}
      `
      div.addEventListener('click', () => onSelectRef.current(station))
      div.addEventListener('mouseenter', () => { div.children[0].style.transform = 'scale(1.08)' })
      div.addEventListener('mouseleave', () => { div.children[0].style.transform = 'scale(1)' })

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(station.lat, station.lng),
        content: div,
        yAnchor: 1,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })
  }

  // SDK init — runs once, creates map
  useEffect(() => {
    const KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!KEY || !containerRef.current) return

    const initMap = () => {
      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(37.52, 127.00),
          level: 9,
        })
      }
      drawMarkers(mapRef.current, stationsRef.current)
    }

    if (window.kakao?.maps) {
      initMap()
    } else {
      const existing = document.getElementById('kakao-maps-sdk')
      if (existing) { existing.onload = () => window.kakao.maps.load(initMap); return }
      const script = document.createElement('script')
      script.id    = 'kakao-maps-sdk'
      script.src   = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
      script.async = true
      script.onload = () => window.kakao.maps.load(initMap)
      document.head.appendChild(script)
    }

    return () => overlaysRef.current.forEach(o => o.setMap(null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw markers when visible station list changes (filter toggle)
  useEffect(() => {
    if (!mapRef.current) return
    drawMarkers(mapRef.current, stations)
  }, [stations]) // eslint-disable-line react-hooks/exhaustive-deps

  const noKey = !import.meta.env.VITE_KAKAO_MAP_KEY

  return (
    <div className="relative h-full w-full bg-[#e8eef5]">
      <div ref={containerRef} className="h-full w-full" />

      {noKey && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#e8eef5]">
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
          </svg>
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
          <div className="absolute bottom-20 left-4 right-4 flex flex-wrap gap-1.5">
            {stations.map(s => {
              const st      = getStationStatus(s)
              const isRiver = s.type === 'river'
              return (
                <button key={s.id} onClick={() => onSelect(s)}
                  className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[11px] font-medium shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: `${st.color}40`, color: st.color }}>
                  {isRiver
                    ? <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M0.5 5.5 Q2 2.5 3.5 5.5 Q5 8.5 6.5 5.5 Q8 2.5 9.5 5.5 Q11 8.5 12 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="5" cy="5" r="1.4" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
                      </svg>
                  }
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

// ── Filter toggle button ──────────────────────────────────────────────────────
const FILTER_CONFIG = [
  {
    key: 'river',
    label: '하천',
    color: '#1d4ed8',
    activeBg: 'rgba(219,234,254,0.95)',
    icon: (active) => (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M0.5 7 Q2.2 3.5 4 7 Q5.8 10.5 7.5 7 Q9.2 3.5 11 7 Q12.8 10.5 14.5 7"
          stroke={active ? '#1d4ed8' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M1 3.5 Q2.7 0.5 4.5 3.5 Q6.2 6.5 8 3.5 Q9.7 0.5 11.5 3.5"
          stroke={active ? '#93c5fd' : '#d1d5db'} strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'sewer',
    label: '하수관',
    color: '#7c3aed',
    activeBg: 'rgba(243,232,255,0.95)',
    icon: (active) => (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke={active ? '#7c3aed' : '#9ca3af'} strokeWidth="1.6"/>
        <circle cx="7" cy="7" r="2.4" stroke={active ? '#c4b5fd' : '#d1d5db'} strokeWidth="1.1"/>
        <circle cx="7" cy="7" r="0.9" fill={active ? '#7c3aed' : '#9ca3af'} opacity="0.6"/>
      </svg>
    ),
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export function RiverPage() {
  const navigate = useNavigate()
  const [selected, setSelected]   = useState(null)
  const [now, setNow]             = useState(new Date())
  const [filter, setFilter]       = useState({ river: true, sewer: true })
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const visibleStations = ALL_STATIONS.filter(s =>
    (s.type === 'river' && filter.river) || (s.type === 'sewer' && filter.sewer)
  )

  const timeStr  = now.toLocaleTimeString('ko-KR', { hour12: false })
  const alertCnt = ALL_STATIONS.filter(s => getStationStatus(s).level !== 'normal').length

  const toggleFilter = (key) => {
    setFilter(f => ({ ...f, [key]: !f[key] }))
    if (selected?.type === key && filter[key]) setSelected(null)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f5f9] dark:bg-[#0f1729]">
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* Header */}
      <header className="grid h-14 shrink-0 grid-cols-[84px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] dark:bg-[#1a2744]">
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
            <span className="text-[11px] font-medium text-[#cc1a1a]">경보 {alertCnt}건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] dark:text-[#94a3b8] sm:block">{timeStr}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        {/* Left nav */}
        <nav className="relative flex w-[84px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white dark:border-[#2d3f5e] dark:bg-[#1a2744]">
          <div className="flex w-full flex-col">
            {NAV_ITEMS.map(({ label, sub, active, route }) => (
              <div
                key={label}
                onClick={() => route && navigate(route)}
                className={`relative flex w-full flex-col items-center py-3 md:py-4 ${
                  active
                    ? 'bg-[rgba(185,217,254,0.4)] dark:bg-[rgba(59,130,246,0.2)]'
                    : `${route ? 'cursor-pointer hover:bg-[#f1f5f9] dark:hover:bg-[#243352]' : ''}`
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-[#3b82f6]" />
                )}
                <span className={`text-[13px] md:text-[14px] ${active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#64748b] dark:text-[#94a3b8]'}`}>
                  {label}
                </span>
                <span className={`text-[9px] md:text-[10px] ${active ? 'text-[#3b82f6]' : 'text-[#64748b] dark:text-[#94a3b8]'}`}>
                  {sub}
                </span>
              </div>
            ))}
          </div>
          <div
            onClick={() => setSettingsOpen(true)}
            className="mt-auto flex w-full cursor-pointer flex-col items-center py-3 hover:bg-[#f1f5f9] dark:hover:bg-[#243352] md:py-4"
          >
            <span className="text-[13px] font-medium text-[#64748b] dark:text-[#94a3b8] md:text-[14px]">설정</span>
            <span className="text-[9px] text-[#64748b] dark:text-[#94a3b8] md:text-[10px]">설정</span>
          </div>
        </nav>

        {/* Content */}
        <div className="flex min-h-0 flex-1">

          {/* Map area */}
          <div className="relative min-h-0 flex-1">
            <KakaoMap stations={visibleStations} onSelect={setSelected} />

            {/* Top-left: filter toggles — always visible */}
            <div className="absolute top-3 left-3 z-50 flex gap-2">
              {FILTER_CONFIG.map(({ key, label, color, activeBg, icon }) => {
                const on = filter[key]
                return (
                  <button
                    key={key}
                    onClick={() => toggleFilter(key)}
                    className="flex items-center gap-2 rounded-full border-2 px-3 py-2 text-[12px] font-bold shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                      background:  on ? activeBg : 'rgba(255,255,255,0.75)',
                      borderColor: on ? color    : '#d1d5db',
                      color:       on ? color    : '#9ca3af',
                    }}
                  >
                    {icon(on)}
                    {label}
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ flexShrink: 0, transition: 'opacity 0.15s' }}
                    >
                      {on ? (
                        <>
                          <circle cx="7" cy="7" r="6.5" fill={color} />
                          <path d="M3.5 7 L5.8 9.3 L10.5 4.5" stroke="#fff" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <circle cx="7" cy="7" r="6.5" stroke="#d1d5db" strokeWidth="1.2" fill="white" />
                          <path d="M4.5 4.5 L9.5 9.5 M9.5 4.5 L4.5 9.5" stroke="#d1d5db" strokeWidth="1.6"
                            strokeLinecap="round" />
                        </>
                      )}
                    </svg>
                  </button>
                )
              })}
            </div>

            {/* Bottom-left: station chips */}
            <div className="absolute bottom-3 left-3 z-50 flex flex-wrap gap-1.5">
              {visibleStations.map(s => {
                const st         = getStationStatus(s)
                const isSelected = selected?.id === s.id
                const isRiver    = s.type === 'river'
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s)}
                    className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[10px] font-semibold shadow-sm transition-all hover:scale-105"
                    style={{
                      borderColor: st.color,
                      background:  isSelected ? st.color : 'rgba(255,255,255,0.92)',
                      color:       isSelected ? '#fff'   : st.color,
                    }}
                  >
                    {isRiver
                      ? <svg width="11" height="7" viewBox="0 0 11 7" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M0.5 5 Q1.8 2 3.2 5 Q4.5 8 5.8 5 Q7.2 2 8.5 5 Q9.8 8 10.5 5"
                            stroke={isSelected ? '#fff' : st.color} strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      : <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="4.5" cy="4.5" r="3.2" stroke={isSelected ? '#fff' : st.color} strokeWidth="1.2"/>
                          <circle cx="4.5" cy="4.5" r="1.3" stroke={isSelected ? 'rgba(255,255,255,0.6)' : `${st.color}88`} strokeWidth="0.9"/>
                        </svg>
                    }
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right detail panel */}
          <div
            className="h-full shrink-0 overflow-hidden border-l border-[#e2e8f0] bg-white transition-all duration-300 dark:border-[#2d3f5e] dark:bg-[#1a2744]"
            style={{ width: selected ? 340 : 0 }}
          >
            {selected && (
              selected.type === 'river'
                ? <RiverStationPanel key={selected.id} station={selected} />
                : <SewerStationPanel key={selected.id} station={selected} />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
