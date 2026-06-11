import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getStationStatus } from '@/utils/statusUtils'
import { FILTER_CONFIG } from '@/mocks/river'
import { riverApi } from '@/api/river'
import { adminApi } from '@/api/admin'
import { KakaoMap, RiverStationPanel, SewerStationPanel, DistrictFilter } from './components'

function toRiverStation(r) {
  return {
    id: r.id,
    regionId: r.regionId,
    type: 'river',
    name: r.displayName,
    lat: r.lat,
    lng: r.lng,
    current: r.waterLevel ?? 0,
    embankment: r.elevationLevee ?? 0,
    plannedFlood: r.elevationFloodPlan ?? 0,
    riverBed: r.elevationRiverbed ?? 0,
    waterLevelStatus: r.waterLevelStatus ?? 'NORMAL',
  }
}

function toSewerStation(s) {
  return {
    id: s.id,
    regionId: s.regionId,
    type: 'sewer',
    name: s.displayName,
    lat: s.lat,
    lng: s.lng,
    fill: (s.fillRate ?? 0) / 100,
  }
}

// Detail API → panel props (same shape existing panels expect)
function toRiverPanelData(d) {
  if (!d || d.waterLevel == null) return null
  return {
    id:                d.id,
    name:              d.displayName,
    current:           d.waterLevel,
    riverBed:          d.elevationRiverbed  ?? 0,
    embankment:        d.elevationLevee     ?? 0,
    plannedFlood:      d.elevationFloodPlan ?? 0,
    trend:             d.trend ?? 'stable',
    observedAt:        d.observedAt,
    waterLevelStatus:  d.waterLevelStatus ?? 'NORMAL',
  }
}

function toSewerPanelData(d) {
  if (!d) return null
  return {
    id:         d.id,
    name:       d.displayName,
    fill:       (d.fillRate ?? 0) / 100,
    location:   d.locationName,
    observedAt: d.observedAt,
  }
}

function PanelSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 px-5 pt-5">
      <div className="h-10 w-3/4 animate-pulse rounded-lg bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
      <div className="h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
      <div className="h-48 animate-pulse rounded-xl bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
      <div className="h-px bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[#e2e8f0] dark:bg-[#2d3f5e]" />
        ))}
      </div>
    </div>
  )
}

export function RiverPage() {
  const [selected, setSelected]           = useState(null)
  const [filter, setFilter]               = useState({ river: true, sewer: true })
  const [selectedRegionIds, setSelectedRegionIds] = useState(new Set())
  const [regionsReady, setRegionsReady]   = useState(false)

  const { data: riverData, refetch: refetchRiver } = useQuery({
    queryKey: QUERY_KEYS.RIVER.MARKERS,
    queryFn:  riverApi.getMarkers,
    staleTime: 0,
  })

  const { data: sewerData, refetch: refetchSewer } = useQuery({
    queryKey: QUERY_KEYS.RIVER.SEWER_MARKERS,
    queryFn:  riverApi.getSewerMarkers,
    staleTime: 0,
  })

  const { data: regionsData = [] } = useQuery({
    queryKey: ['admin', 'regions'],
    queryFn:  () => adminApi.getRegions().then(r => r.data),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!regionsData.length) return
    setSelectedRegionIds(new Set(regionsData.map(r => r.id)))
    setRegionsReady(true)
  }, [regionsData])

  const { data: riverDetail, isLoading: riverDetailLoading } = useQuery({
    queryKey: [...QUERY_KEYS.RIVER.DETAIL, selected?.id],
    queryFn:  () => riverApi.getDetail(selected.id),
    enabled:  !!selected && selected.type === 'river',
  })

  const { data: sewerDetail, isLoading: sewerDetailLoading } = useQuery({
    queryKey: [...QUERY_KEYS.RIVER.SEWER_DETAIL, selected?.id],
    queryFn:  () => riverApi.getSewerDetail(selected.id),
    enabled:  !!selected && selected.type === 'sewer',
  })

  const riverStations = (riverData ?? []).map(toRiverStation)
  const sewerStations = (sewerData ?? []).map(toSewerStation)
  const allStations   = [...riverStations, ...sewerStations]

  // regionId가 실제로 데이터에 있는지 확인 (서버 재시작 전에는 undefined)
  const regionFilterActive = regionsReady && allStations.some(s => s.regionId != null)

  const visibleStations = allStations.filter(s => {
    if (s.type === 'river' && !filter.river) return false
    if (s.type === 'sewer' && !filter.sewer) return false
    if (regionFilterActive && !selectedRegionIds.has(s.regionId)) return false
    return true
  })
  const alertCnt = allStations.filter(s => getStationStatus(s).level !== 'normal').length

  const toggleFilter = (key) => {
    setFilter(f => ({ ...f, [key]: !f[key] }))
    if (selected?.type === key && filter[key]) setSelected(null)
  }

  const toggleRegion = (id) => {
    setSelectedRegionIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllRegions  = () => setSelectedRegionIds(new Set(regionsData.map(r => r.id)))
  const clearAllRegions   = () => setSelectedRegionIds(new Set())

  const riverPanelData = toRiverPanelData(riverDetail)
  const sewerPanelData = toSewerPanelData(sewerDetail)
  const detailLoading  = selected?.type === 'river' ? riverDetailLoading : sewerDetailLoading

  return (
    <DashboardLayout
      activeRoute={ROUTES.RIVER}
      alertCount={alertCnt}
      outerBg="bg-[#f1f5f9]"
      onTabReclick={() => { refetchRiver(); refetchSewer() }}
    >
      <div className="relative flex min-h-0 flex-1">

        {/* Map area */}
        <div className="relative min-h-0 flex-1 pb-14 md:pb-0">
          <KakaoMap stations={visibleStations} onSelect={setSelected} />

          {/* District filter (bottom-right — keeps Kakao logo bottom-left clear) */}
          {regionsReady && (
            <DistrictFilter
              regions={regionsData}
              selectedIds={selectedRegionIds}
              onToggle={toggleRegion}
              onSelectAll={selectAllRegions}
              onClearAll={clearAllRegions}
            />
          )}

          {/* Filter toggles — hide on mobile when detail panel is open */}
          <div className={`absolute top-3 left-3 z-50 flex gap-2 ${selected ? 'max-md:hidden' : ''}`}>
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
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
        </div>

        {/* Mobile backdrop */}
        {selected && (
          <div
            className="absolute inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSelected(null)}
          />
        )}

        {/* Right detail panel — mobile: full-width slide-over, desktop: side panel */}
        <div
          className={[
            'overflow-hidden bg-white dark:bg-[#1a2744] transition-all duration-300',
            'border-l border-[#e2e8f0] dark:border-[#2d3f5e]',
            // mobile: absolute full-width overlay, slides in from right
            'absolute inset-y-0 right-0 z-40 w-full',
            selected ? '' : 'max-md:translate-x-full',
            // desktop: static side panel controlled by width
            'md:relative md:inset-auto md:z-auto md:h-full md:shrink-0',
            selected ? 'md:w-[340px]' : 'md:w-0',
          ].join(' ')}
        >
          {selected && (
            detailLoading
              ? <PanelSkeleton />
              : selected.type === 'river'
                ? riverPanelData
                  ? <RiverStationPanel key={selected.id} station={riverPanelData} onClose={() => setSelected(null)} />
                  : <PanelSkeleton />
                : sewerPanelData
                  ? <SewerStationPanel key={selected.id} station={sewerPanelData} onClose={() => setSelected(null)} />
                  : <PanelSkeleton />
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
