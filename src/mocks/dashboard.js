export const DASHBOARD_ALERTS = [
  { type: '홍수 경보', typeBg: 'rgba(243,66,54,0.15)',  typeText: '#f34236', rowBg: 'rgba(243,66,54,0.07)',  time: '14:28', place: '중랑천 상류 망우 관측소' },
  { type: '홍수 주의', typeBg: 'rgba(254,150,0,0.15)',  typeText: '#fe9600', rowBg: 'rgba(254,150,0,0.07)',  time: '14:15', place: '한강 광진 수위관측소'   },
  { type: '침수 위험', typeBg: 'rgba(254,150,0,0.15)',  typeText: '#fe9600', rowBg: 'rgba(254,150,0,0.07)',  time: '14:05', place: '강남구 역삼1동 일대'    },
  { type: '댐 방류',   typeBg: 'rgba(30,135,229,0.15)', typeText: '#1e87e5', rowBg: 'rgba(30,135,229,0.07)', time: '13:50', place: '소양강댐 320 m³/s'      },
]

export function buildPoll(prev) {
  const rnd  = (v, d) => Math.max(0, +(v + (Math.random() - 0.5) * d).toFixed(1))
  const rndI = (v, d) => Math.max(0, Math.round(v + (Math.random() - 0.5) * d))
  const avg  = rnd(prev?.avgRainfall ?? 12.4, 2.4)
  return {
    avgRainfall: avg,
    riverDanger: rndI(prev?.riverDanger ?? 3, 1),
    sewerDanger: rndI(prev?.sewerDanger ?? 7, 2),
    stations:    { total: 89, normal: 79, caution: 7, danger: 3 },
    lastPoll:    new Date(),
    history:     [...(prev?.history ?? [2.1, 5.3, 8.7, 12.4, 9.2]).slice(-5), avg],
  }
}
