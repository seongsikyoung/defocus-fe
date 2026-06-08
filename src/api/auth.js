
import api from './index'

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (data) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/users/me'),
  refresh: () => api.post('/auth/refresh'),
}
