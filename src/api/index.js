import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})


api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthCheck = url.includes('/users/me')
    const isAuthEndpoint = url.includes('/auth/')
    if (error.response?.status === 401 && !isAuthCheck && !isAuthEndpoint) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
