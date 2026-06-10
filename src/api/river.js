import api from './index'

export const riverApi = {
  getMarkers:      ()   => api.get('/river/markers').then(r => r.data),
  getSewerMarkers: ()   => api.get('/sewer/markers').then(r => r.data),
  getDetail:       (id) => api.get(`/river/detail/${id}`).then(r => r.data),
  getSewerDetail:  (id) => api.get(`/sewer/detail/${id}`).then(r => r.data),
}
