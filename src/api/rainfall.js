import api from './index'

const formatDt = (s) => (s.length === 16 ? s + ':00' : s)

export const rainfallApi = {
  getRealtime: () => api.get('/rainfall/realtime').then(r => r.data),
  getPeriod: (from, to) =>
    api.get('/rainfall/period', { params: { from: formatDt(from), to: formatDt(to) } }).then(r => r.data),
}
