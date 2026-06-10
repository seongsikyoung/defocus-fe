import api from './index.js'

export const dashboardApi = {
  getSummary:          () => api.get('/dashboard'),
  refreshAiAnalysis:   () => api.post('/alert/ai-analysis/refresh'),
}
