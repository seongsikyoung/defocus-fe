import { getSewerStatus } from '@/utils/statusUtils'
import { PipeGauge } from './PipeGauge'

export function SewerStationPanel({ station }) {
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
            { label: '충만도',    value: `${(station.fill * 100).toFixed(1)}%`, color: status.color,  highlight: true },
            { label: '관로 직경', value: `${station.diameter} mm`,              color: '#1e293b',     neutral: true   },
            { label: '역류 위험', value: backflow,                              color: backflowColor                   },
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
