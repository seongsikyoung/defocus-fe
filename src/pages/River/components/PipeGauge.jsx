import { useEffect, useState } from 'react'
import { getSewerStatus } from '@/utils/statusUtils'
import { SEWER_REF_LINES } from '@/mocks/river'

export function PipeGauge({ station }) {
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
