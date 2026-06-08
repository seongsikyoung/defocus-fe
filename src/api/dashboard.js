import api from './index.js'

export const dashboardApi = {
  getSummary: () => api.get('/dashboard'),
}
