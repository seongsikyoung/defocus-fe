import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STATIONS = [
  { id: 1, name: '강남구 역삼동',    lat: 37.4994, lng: 127.0349, fill: 0.87, diameter: 800,  location: '역삼로 37길' },
  { id: 2, name: '서초구 반포동',    lat: 37.5037, lng: 126.9988, fill: 0.65, diameter: 600,  location: '반포대로 55' },
  { id: 3, name: '관악구 신림동',    lat: 37.4843, lng: 126.9294, fill: 0.92, diameter: 500,  location: '신림로 23' },
  { id: 4, name: '동작구 노량진',    lat: 37.5149, lng: 126.9396, fill: 0.38, diameter: 700,  location: '노량진로 48' },
  { id: 5, name: '영등포구 여의도',  lat: 37.5219, lng: 126.9245, fill: 0.73, diameter: 900,  location: '여의도동 35-1' },
  { id: 6, name: '마포구 합정동',    lat: 37.5498, lng: 126.9139, fill: 0.45, diameter: 450,  location: '합정로 22' },
  { id: 7, name: '성동구 성수동',    lat: 37.5443, lng: 127.0557, fill: 1.0,  diameter: 600,  location: '성수이로 5' },
]

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황', active: false, route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황', active: false, route: ROUTES.RAINFALL  },
  { label: '하천', sub: '하천수위', active: false, route: ROUTES.RIVER     },
  { label: '하수', sub: '하수관로', active: true,  route: ROUTES.SEWER     },
  { label: 'AI',   sub: 'AI분석',   active: false, route: null             },
]

// ── Status helper ────────────────────────────────────────────────────────────
function getStatus(fill) {
  if (fill >= 1.0) return { level: 'full',    label: '만수 · 역류', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (fill >= 0.8) return { level: 'danger',  label: '위험',        color: '#f34236', bg: 'rgba(243,66,54,0.10)',  dot: '#f34236' }
  if (fill >= 0.7) return { level: 'warning', label: '경계',        color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (fill >= 0.5) return { level: 'caution', label: '주의',        color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                   { level: 'normal', label: '정상',        color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

// Reference levels drawn inside the pipe
const REF_LINES = [
  { f: 0.5, color: '#24c552', label: '50%' },
  { f: 0.7, color: '#f5c518', label: '70%' },
  { f: 0.8, color: '#fe9600', label: '80%' },
]

// ── Pipe Gauge SVG ───────────────────────────────────────────────────────────
function PipeGauge({ station }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [station.id])

  const { fill } = station
  const status   = getStatus(fill)

  const SVG_W = 260
  const SVG_H = 260
  const cx    = SVG_W / 2
  const cy    = SVG_H / 2
  const R     = 95   // inner pipe radius
  const WALL  = 10   // pipe wall thickness

  const displayFill = animated ? fill : 0
  const waterY  = cy + R - displayFill * 2 * R
  const waterH  = displayFill * 2 * R + 12   // extend past pipe bottom for clean clip

  const waterColor = status.level === 'full' || status.level === 'danger'
    ? '#f34236'
    : status.level === 'warning'
    ? '#fe9600'
    : status.level === 'caution'
    ? '#f5c518'
    : '#3b82f6'

  const waterLight = status.level === 'full' || status.level === 'danger'
    ? '#fca5a5'
    : status.level === 'warning'
    ? '#fed7aa'
    : status.level === 'caution'
    ? '#fef08a'
    : '#93c5fd'

  const gradId = `sewer-grad-${station.id}`
  const clipId = `pipe-clip-${station.id}`
  const wallGradId = `wall-grad-${station.id}`

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Percentage label */}
      <div className="flex items-end gap-1">
        <span className="text-[32px] font-bold leading-none" style={{ color: status.color }}>
          {Math.round(fill * 100)}
        </span>
        <span className="mb-1 text-[14px] text-[#94a3b8]">%</span>
        <span className="mb-0.5 ml-2 text-[13px] font-medium" style={{ color: status.color }}>
          {status.label}
        </span>
      </div>

      {/* SVG pipe cross-section */}
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        <defs>
          {/* Water gradient */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={waterColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={waterLight}  stopOpacity="0.55" />
          </linearGradient>

          {/* Pipe wall radial gradient (3D look) */}
          <radialGradient id={wallGradId} cx="38%" cy="32%" r="62%" fx="38%" fy="32%">
            <stop offset="0%"   stopColor="#d1d9e0" />
            <stop offset="60%"  stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>

          {/* Clip to inner pipe circle */}
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>

        {/* Outer pipe wall */}
        <circle cx={cx} cy={cy} r={R + WALL}     fill="#475569" />
        <circle cx={cx} cy={cy} r={R + WALL - 2} fill={`url(#${wallGradId})`} />

        {/* Inner pipe (empty/dry area) */}
        <circle cx={cx} cy={cy} r={R} fill="#1e293b" />

        {/* Subtle pipe interior grid */}
        <g clipPath={`url(#${clipId})`} opacity="0.06">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`}
              x1={cx - R + i * (2*R/7)} y1={cy - R}
              x2={cx - R + i * (2*R/7)} y2={cy + R}
              stroke="#fff" strokeWidth="1"
            />
          ))}
        </g>

        {/* Water fill */}
        <rect
          x={cx - R - 2}
          y={waterY}
          width={2 * R + 4}
          height={waterH}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
          style={{ transition: 'y 1.1s cubic-bezier(0.34,1.56,0.64,1), height 1.1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />

        {/* Water surface shimmer line */}
        {animated && displayFill > 0.02 && (
          <line
            x1={cx - R} y1={waterY}
            x2={cx + R} y2={waterY}
            stroke="#fff"
            strokeWidth={1.5}
            opacity={0.35}
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Reference level lines */}
        {REF_LINES.map(({ f, color }) => {
          const refY = cy + R - f * 2 * R
          return (
            <line
              key={f}
              x1={cx - R} y1={refY}
              x2={cx + R} y2={refY}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="5 3"
              opacity={0.55}
              clipPath={`url(#${clipId})`}
            />
          )
        })}

        {/* Reference labels on right side */}
        {REF_LINES.map(({ f, color, label }) => {
          const refY = cy + R - f * 2 * R
          return (
            <text key={f}
              x={cx + R + 8} y={refY + 4}
              fontSize={9} fill={color} fontWeight="600" opacity={0.85}
            >
              {label}
            </text>
          )
        })}

        {/* Inner ring gloss effect */}
        <circle cx={cx} cy={cy} r={R}
          fill="none"
          stroke="white"
          strokeWidth={1.5}
          opacity={0.1}
        />

        {/* Full / backflow overlay */}
        {fill >= 1.0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect x={cx - R} y={cy - R} width={2*R} height={R * 0.3}
              fill="rgba(243,66,54,0.25)"
            />
            <text x={cx} y={cy - R + 18} textAnchor="middle"
              fontSize={10} fill="#f34236" fontWeight="700" opacity={0.9}
            >
              역류 발생
            </text>
          </g>
        )}

        {/* Pipe bolt holes (decorative) */}
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

// ── Station Detail Panel ─────────────────────────────────────────────────────
function StationPanel({ station }) {
  const status   = getStatus(station.fill)
  const backflow = station.fill >= 0.8 ? '높음' : station.fill >= 0.5 ? '보통' : '낮음'
  const backflowColor = station.fill >= 0.8 ? '#f34236' : station.fill >= 0.5 ? '#fe9600' : '#24c552'

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8]">하수관로 관측소</p>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#1e293b]">{station.name}</h2>
            <p className="mt-0.5 text-[11px] text-[#94a3b8]">{station.location}</p>
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

      {/* Pipe gauge */}
      <div className="shrink-0 px-5 py-4">
        <p className="mb-2 text-[11px] font-semibold text-[#64748b]">관로 충만도 단면</p>
        <PipeGauge station={station} />
      </div>

      <div className="mx-5 h-px bg-[#e2e8f0]" />

      {/* Metrics */}
      <div className="shrink-0 px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold text-[#64748b]">주요 지표</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '충만도',    value: `${(station.fill * 100).toFixed(1)}%`,      color: status.color, highlight: true },
            { label: '관로 직경', value: `${station.diameter} mm`,                   color: '#1e293b' },
            { label: '역류 위험', value: backflow,                                    color: backflowColor },
            { label: '기준 상태', value: station.fill >= 0.8 ? '즉시 조치' : station.fill >= 0.5 ? '모니터링' : '이상 없음', color: status.color },
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

      {/* Warning message */}
      {station.fill >= 0.7 && (
        <div className="mx-5 mb-5 rounded-[10px] border px-4 py-3"
          style={{ borderColor: `${status.color}40`, background: status.bg }}
        >
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

// ── Kakao Map ────────────────────────────────────────────────────────────────
function KakaoMap({ stations, onSelect }) {
  const containerRef = useRef(null)
  const overlaysRef  = useRef([])

  useEffect(() => {
    const KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!KEY || !containerRef.current) return

    const initMap = () => {
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(37.51, 126.97),
        level: 9,
      })

      overlaysRef.current.forEach(o => o.setMap(null))
      overlaysRef.current = []

      stations.forEach(station => {
        const st = getStatus(station.fill)

        const div = document.createElement('div')
        div.style.cssText = `display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:translateY(-100%);`
        div.innerHTML = `
          <div style="
            background:${st.color}; color:#fff;
            font-size:11px; font-weight:700;
            padding:4px 9px; border-radius:20px;
            white-space:nowrap;
            box-shadow:0 2px 8px ${st.color}55;
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
        div.addEventListener('mouseenter', () => { div.querySelector('div').style.transform = 'scale(1.08)' })
        div.addEventListener('mouseleave', () => { div.querySelector('div').style.transform = 'scale(1)' })

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
      if (existing) { existing.onload = () => window.kakao.maps.load(initMap); return }
      const script = document.createElement('script')
      script.id    = 'kakao-maps-sdk'
      script.src   = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
      script.async = true
      script.onload = () => window.kakao.maps.load(initMap)
      document.head.appendChild(script)
    }

    return () => overlaysRef.current.forEach(o => o.setMap(null))
  }, [stations])

  const noKey = !import.meta.env.VITE_KAKAO_MAP_KEY

  return (
    <div className="relative h-full w-full bg-[#e8eef5]">
      <div ref={containerRef} className="h-full w-full" />

      {noKey && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#e8eef5]">
          <svg className="absolute inset-0 h-full w-full opacity-30">
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

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {stations.map(s => {
              const st = getStatus(s.fill)
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
export function SewerPage() {
  const navigate  = useNavigate()
  const [selected, setSelected] = useState(null)
  const [now, setNow]           = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr  = now.toLocaleTimeString('ko-KR', { hour12: false })
  const alertCnt = MOCK_STATIONS.filter(s => getStatus(s.fill).level !== 'normal').length

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

          {/* Map */}
          <div className="relative min-h-0 flex-1">
            <KakaoMap stations={MOCK_STATIONS} onSelect={setSelected} />

            {/* Station chips */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {MOCK_STATIONS.map(s => {
                const st = getStatus(s.fill)
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

          {/* Right panel */}
          <div
            className="h-full shrink-0 overflow-hidden border-l border-[#e2e8f0] bg-white transition-all duration-300"
            style={{ width: selected ? 340 : 0 }}
          >
            {selected && <StationPanel key={selected.id} station={selected} />}
          </div>

          {/* Prompt */}
          {!selected && (
            <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="1.8" />
                  <path d="M12 8v4m0 4h.01" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
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
