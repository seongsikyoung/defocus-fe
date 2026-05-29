export const MOCK_RAINFALL = {
  '도봉구': 8.5,  '노원구': 13.1, '강북구': 9.2,  '은평구': 5.7,  '성북구': 18.6,
  '중랑구': 23.4, '서대문구': 7.3,'종로구': 15.2, '동대문구': 21.7,'광진구': 28.9,
  '마포구': 6.8,  '용산구': 11.5, '중구': 14.3,  '성동구': 26.4, '강동구': 20.1,
  '양천구': 4.3,  '영등포구': 8.8,'동작구': 17.3, '서초구': 33.7, '강남구': 44.2,
  '강서구': 3.9,  '구로구': 5.1,  '관악구': 20.8, '금천구': 9.7,  '송파구': 39.6,
}

export const RAINFALL_LEGEND = [
  { label: '정상', color: '#dbeafe' },
  { label: '관심', color: '#93c5fd' },
  { label: '주의', color: '#60a5fa' },
  { label: '경계', color: '#2563eb' },
  { label: '위험', color: '#1e3a8a' },
]

export const RAINFALL_ALERTS = [
  { district: '강남구', type: '호우 경보',   time: '14:20', desc: '시간당 44mm 이상 — 도심 침수 위험',    severe: true  },
  { district: '서초구', type: '호우 경보',   time: '14:25', desc: '시간당 34mm — 배수불량 구간 침수',     severe: true  },
  { district: '송파구', type: '호우 주의보', time: '14:28', desc: '3시간 누적 62mm — 관심 필요',          severe: false },
]

const pad2 = n => String(n).padStart(2, '0')

export const toDatetimeLocal = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`

export const fmtDateTime = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`

export function buildMockSteps(from, to) {
  const steps = []
  let cur = new Date(from)
  const end = new Date(to)
  const totalMs = Math.max(end - cur, 1)
  let i = 0
  while (cur <= end && i < 144) {
    const peak = Math.sin((i / Math.max(1, (totalMs / (10 * 60 * 1000)))) * Math.PI)
    const data = {}
    Object.keys(MOCK_RAINFALL).forEach(k => {
      data[k] = Math.max(0, MOCK_RAINFALL[k] * (0.25 + peak * 0.9) + (Math.random() - 0.5) * 8)
    })
    steps.push({ timestamp: new Date(cur), data })
    cur = new Date(cur.getTime() + 10 * 60 * 1000)
    i++
  }
  return steps
}
