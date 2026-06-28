import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('dealbox_token')
    const savedUser = localStorage.getItem('dealbox_user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('dealbox_token', res.data.token)
    localStorage.setItem('dealbox_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (name, email, password, phone, inviteCode) => {
    const res = await api.post('/auth/register', { name, email, password, phone, invite_code: inviteCode || '' })
    localStorage.setItem('dealbox_token', res.data.token)
    localStorage.setItem('dealbox_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me')
      const updated = res.data
      localStorage.setItem('dealbox_user', JSON.stringify(updated))
      setUser(updated)
      return updated
    } catch { /* token expired */ }
  }

  const logout = () => {
    localStorage.removeItem('dealbox_token')
    localStorage.removeItem('dealbox_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
