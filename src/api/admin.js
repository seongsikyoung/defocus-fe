import api from './index.js'

export const adminApi = {
  getRegions:      () => api.get('/admin/regions'),
  simulateRegion:  (regionId) => api.post(`/admin/simulate/rain/${regionId}`),
  simulateAll:     () => api.post('/admin/simulate/rain/all'),
  clearSimulated:  () => api.delete('/admin/simulate/clear'),
}
