import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch(err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, margin: '0 auto 16px'
          }}>D</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700 }}>DealBox</h1>
          <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: 14 }}>Wholesale Real Estate Platform</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Sign In</h2>
          {error && <div style={{
            padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, color: '#f87171', fontSize: 14, marginBottom: 20
          }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16}}/> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text3)' }}>
            No account? <Link to="/register" style={{ color: 'var(--accent)' }}>Join DealBox</Link>
          </p>
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
            <strong style={{ color: 'var(--text2)' }}>Admin demo:</strong> admin@dealbox.com / admin123
          </div>
        </div>
      </div>
    </div>
  )
}
