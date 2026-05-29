export function getRainfallLevel(mm) {
  if (mm >= 50) return { label: '위험', mapColor: '#1e3a8a', textColor: '#ffffff', badgeBg: '#1e3a8a', badgeText: '#ffffff' }
  if (mm >= 30) return { label: '경계', mapColor: '#2563eb', textColor: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' }
  if (mm >= 20) return { label: '주의', mapColor: '#60a5fa', textColor: '#1e293b', badgeBg: '#93c5fd', badgeText: '#1e40af' }
  if (mm >= 10) return { label: '관심', mapColor: '#93c5fd', textColor: '#1e293b', badgeBg: '#bfdbfe', badgeText: '#1e40af' }
  return           { label: '정상', mapColor: '#dbeafe', textColor: '#1e293b', badgeBg: '#dbeafe', badgeText: '#1d4ed8' }
}

export function getRiverStatus(s) {
  if (s.current >= s.embankment)          return { level: 'flood',   label: '범람 임박', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (s.current >= s.plannedFlood)        return { level: 'danger',  label: '위험',      color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (s.current >= s.plannedFlood * 0.75) return { level: 'caution', label: '주의',      color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                                          { level: 'normal',  label: '정상',      color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

export function getSewerStatus(fill) {
  if (fill >= 1.0) return { level: 'full',    label: '만수 · 역류', color: '#f34236', bg: 'rgba(243,66,54,0.12)',  dot: '#f34236' }
  if (fill >= 0.8) return { level: 'danger',  label: '위험',        color: '#f34236', bg: 'rgba(243,66,54,0.10)',  dot: '#f34236' }
  if (fill >= 0.7) return { level: 'warning', label: '경계',        color: '#fe9600', bg: 'rgba(254,150,0,0.12)',  dot: '#fe9600' }
  if (fill >= 0.5) return { level: 'caution', label: '주의',        color: '#f5c518', bg: 'rgba(245,197,24,0.12)', dot: '#f5c518' }
  return                   { level: 'normal',  label: '정상',        color: '#24c552', bg: 'rgba(36,197,82,0.12)',  dot: '#24c552' }
}

export function getStationStatus(station) {
  return station.type === 'river' ? getRiverStatus(station) : getSewerStatus(station.fill)
}
