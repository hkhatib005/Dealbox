import { useState } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../AuthContext'

export default function PendingApproval() {
  const { user, logout, refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    setChecked(false)
    const updated = await refreshUser()
    setChecking(false)
    setChecked(true)
    if (updated?.approved) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
          border: '2px solid rgba(251,191,36,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Clock size={32} color="#fbbf24" />
        </div>

        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Pending Approval
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
          Hey <strong style={{ color: 'var(--text1)' }}>{user?.name}</strong>, your account is under review.
        </p>
        <p style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          An admin will approve your access shortly. You'll get full access to buy boxes,
          deal feeds, and the property map once approved.
        </p>

        <div className="card" style={{ marginBottom: 20, textAlign: 'left', padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
            WHAT HAPPENS NEXT
          </div>
          {[
            'Admin reviews your application',
            'You receive access to the full platform',
            'Create buy boxes and get matched to deals',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0
              }}>{i + 1}</div>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleCheck}
            disabled={checking}
            style={{ gap: 8 }}
          >
            <RefreshCw size={15} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? 'Checking...' : 'Check Status'}
          </button>
          <button className="btn btn-ghost" onClick={logout} style={{ gap: 8 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {checked && (
          <p style={{ marginTop: 16, fontSize: 13, color: '#f87171' }}>
            Still pending — check back soon or contact the admin.
          </p>
        )}
      </div>
    </div>
  )
}
