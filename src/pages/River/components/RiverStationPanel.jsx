import { getRiverStatus } from '@/utils/statusUtils'
import { RiverGauge } from './RiverGauge'

function fmtObservedAt(iso) {
  if (!iso) return '—'
  const d    = new Date(iso)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}시 ${min}분`
}

export function RiverStationPanel({ station, onClose }) {
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
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-[7px] px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569] dark:hover:bg-[#2d3f5e] dark:hover:text-[#cbd5e1]"
                aria-label="닫기"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
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
            { label: '실시간 수위', value: `${station.current.toFixed(2)} m`,     color: '#3b82f6', highlight: true  },
            { label: '현재 수심',   value: `${depth} m`,                           color: '#1e293b', neutral:   true  },
            { label: '제방고',      value: `${station.embankment.toFixed(1)} m`,   color: '#f34236'                   },
            { label: '계획홍수위',  value: `${station.plannedFlood.toFixed(1)} m`, color: '#fe9600'                   },
            { label: '하상고',      value: `${station.riverBed.toFixed(1)} m`,     color: '#94a3b8'                   },
            { label: '여유고',      value: `${toFlood > 0 ? '+' : ''}${toFlood} m`, color: toFlood < 0 ? '#f34236' : '#24c552' },
            { label: '관측 시각',   value: fmtObservedAt(station.observedAt),        color: '#1e293b', neutral: true, wide: true },
          ].map(({ label, value, color, highlight, neutral, wide }) => (
            <div key={label}
              className={`flex flex-col gap-1 rounded-[8px] border bg-[#f8fafc] px-3 py-2.5 dark:bg-[#111d35]${wide ? ' col-span-2' : ''}`}
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
