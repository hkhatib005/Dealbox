import axios from 'axios'

// In production VITE_API_URL points to the deployed backend (e.g. https://dealbox-api.onrender.com)
// In dev the Vite proxy handles /api -> localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('dealbox_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dealbox_token')
      localStorage.removeItem('dealbox_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
