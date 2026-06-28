import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', invite_code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = await register(form.name, form.email, form.password, form.phone, form.invite_code)
      navigate(user.approved ? '/dashboard' : '/pending')
    } catch(err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  const set = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}))

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, margin: '0 auto 16px'
          }}>D</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700 }}>Join DealBox</h1>
          <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: 14 }}>Start finding wholesale deals today</p>
        </div>

        <div className="card">
          {error && <div style={{
            padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, color: '#f87171', fontSize: 14, marginBottom: 20
          }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="John Smith" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label>Phone (optional)</label>
              <input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Create a password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Invite Code <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional — skip for manual review)</span></label>
              <input
                placeholder="e.g. DEALBOX2024"
                value={form.invite_code}
                onChange={set('invite_code')}
                style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16}}/> Creating account...</> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)', padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
            No invite code? Submit your info and we'll review your application.
          </p>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text3)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
