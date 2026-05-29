import { useState } from 'react'
import { ROUTES } from '@/constants/routes'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getStationStatus } from '@/utils/statusUtils'
import { ALL_STATIONS, FILTER_CONFIG } from '@/mocks/river'
import { KakaoMap, RiverStationPanel, SewerStationPanel } from './components'

export function RiverPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState({ river: true, sewer: true })

  const visibleStations = ALL_STATIONS.filter(s =>
    (s.type === 'river' && filter.river) || (s.type === 'sewer' && filter.sewer)
  )
  const alertCnt = ALL_STATIONS.filter(s => getStationStatus(s).level !== 'normal').length

  const toggleFilter = (key) => {
    setFilter(f => ({ ...f, [key]: !f[key] }))
    if (selected?.type === key && filter[key]) setSelected(null)
  }

  return (
    <DashboardLayout
      activeRoute={ROUTES.RIVER}
      alertCount={alertCnt}
      outerBg="bg-[#f1f5f9]"
    >
      <div className="flex min-h-0 flex-1">

        {/* Map area */}
        <div className="relative min-h-0 flex-1">
          <KakaoMap stations={visibleStations} onSelect={setSelected} />

          {/* Filter toggles */}
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transition: 'opacity 0.15s' }}>
                    {on ? (
                      <>
                        <circle cx="7" cy="7" r="6.5" fill={color} />
                        <path d="M3.5 7 L5.8 9.3 L10.5 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <>
                        <circle cx="7" cy="7" r="6.5" stroke="#d1d5db" strokeWidth="1.2" fill="white" />
                        <path d="M4.5 4.5 L9.5 9.5 M9.5 4.5 L4.5 9.5" stroke="#d1d5db" strokeWidth="1.6" strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                </button>
              )
            })}
          </div>

          {/* Station chips */}
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
    </DashboardLayout>
  )
}
