import { useEffect, useState } from 'react'
import { getRiverStatus } from '@/utils/statusUtils'

export function RiverGauge({ station }) {
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

  const waterH     = animated ? (bedY - currentY) : 0
  const waterTopY  = animated ? currentY : bedY
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
