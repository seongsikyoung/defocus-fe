export const MOCK_RIVER_STATIONS = [
  { id: 'r1', type: 'river', name: '중랑천(망우)',   lat: 37.5921, lng: 127.0857, riverBed: 12.5, plannedFlood: 18.0, embankment: 20.5, current: 17.2, trend: 'rising'  },
  { id: 'r2', type: 'river', name: '한강(광진)',     lat: 37.5389, lng: 127.0830, riverBed: 3.1,  plannedFlood: 10.5, embankment: 12.0, current: 11.3, trend: 'rising'  },
  { id: 'r3', type: 'river', name: '탄천(성남)',     lat: 37.4383, lng: 127.1324, riverBed: 6.2,  plannedFlood: 12.0, embankment: 14.5, current: 7.5,  trend: 'stable'  },
  { id: 'r4', type: 'river', name: '안양천(광명)',   lat: 37.4489, lng: 126.8659, riverBed: 4.8,  plannedFlood: 9.5,  embankment: 11.0, current: 5.2,  trend: 'falling' },
  { id: 'r5', type: 'river', name: '청계천(성동)',   lat: 37.5683, lng: 127.0183, riverBed: 8.3,  plannedFlood: 11.0, embankment: 12.5, current: 9.8,  trend: 'rising'  },
  { id: 'r6', type: 'river', name: '홍제천(서대문)', lat: 37.5752, lng: 126.9380, riverBed: 15.2, plannedFlood: 20.0, embankment: 22.0, current: 16.1, trend: 'stable'  },
  { id: 'r7', type: 'river', name: '불광천(은평)',   lat: 37.6013, lng: 126.9282, riverBed: 18.5, plannedFlood: 23.5, embankment: 25.0, current: 19.2, trend: 'stable'  },
]

export const MOCK_SEWER_STATIONS = [
  { id: 's1', type: 'sewer', name: '강남구 역삼동',   lat: 37.4994, lng: 127.0349, fill: 0.87, diameter: 800, location: '역삼로 37길',   observedAt: '2026-06-05T14:10:00' },
  { id: 's2', type: 'sewer', name: '서초구 반포동',   lat: 37.5037, lng: 126.9988, fill: 0.65, diameter: 600, location: '반포대로 55',   observedAt: '2026-06-05T14:10:00' },
  { id: 's3', type: 'sewer', name: '관악구 신림동',   lat: 37.4843, lng: 126.9294, fill: 0.92, diameter: 500, location: '신림로 23',     observedAt: '2026-06-05T14:10:00' },
  { id: 's4', type: 'sewer', name: '동작구 노량진',   lat: 37.5149, lng: 126.9396, fill: 0.38, diameter: 700, location: '노량진로 48',   observedAt: '2026-06-05T14:10:00' },
  { id: 's5', type: 'sewer', name: '영등포구 여의도', lat: 37.5219, lng: 126.9245, fill: 0.73, diameter: 900, location: '여의도동 35-1', observedAt: '2026-06-05T14:10:00' },
  { id: 's6', type: 'sewer', name: '마포구 합정동',   lat: 37.5498, lng: 126.9139, fill: 0.45, diameter: 450, location: '합정로 22',     observedAt: '2026-06-05T14:10:00' },
  { id: 's7', type: 'sewer', name: '성동구 성수동',   lat: 37.5443, lng: 127.0557, fill: 1.0,  diameter: 600, location: '성수이로 5',    observedAt: '2026-06-05T14:10:00' },
]

export const ALL_STATIONS = [...MOCK_RIVER_STATIONS, ...MOCK_SEWER_STATIONS]

export const SEWER_REF_LINES = [
  { f: 0.5, color: '#24c552', label: '50%' },
  { f: 0.7, color: '#f5c518', label: '70%' },
  { f: 0.8, color: '#fe9600', label: '80%' },
]

export const RIVER_ICON_SVG = `<svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:5px;flex-shrink:0;display:block;">
  <path d="M0.5 6.5 Q2.2 3 3.8 6.5 Q5.4 10 7 6.5 Q8.6 3 10.2 6.5 Q11.8 10 13.5 6.5" stroke="rgba(255,255,255,0.92)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M1 3 Q2.5 0.5 4 3 Q5.5 5.5 7 3 Q8.5 0.5 10 3" stroke="rgba(255,255,255,0.45)" stroke-width="1.1" stroke-linecap="round" fill="none"/>
</svg>`

export const SEWER_ICON_SVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:5px;flex-shrink:0;display:block;">
  <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.92)" stroke-width="1.6"/>
  <circle cx="6.5" cy="6.5" r="2.1" stroke="rgba(255,255,255,0.5)" stroke-width="1.1"/>
  <circle cx="6.5" cy="6.5" r="0.8" fill="rgba(255,255,255,0.55)"/>
</svg>`

export const FILTER_CONFIG = [
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
