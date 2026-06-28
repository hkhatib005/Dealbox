import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LayoutDashboard, Package, Search, Map, ShieldCheck, LogOut, Bell, ChevronRight } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/buyboxes', icon: Package, label: 'Buy Boxes' },
    { to: '/deals', icon: Search, label: 'Deals' },
    { to: '/map', icon: Map, label: 'Map View' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : [])
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800
            }}>D</div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18 }}>DealBox</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Wholesale Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'all 0.15s',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? '#60a5fa' : 'var(--text2)',
              border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent'
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)',
            marginBottom: 8
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px', minHeight: '100vh', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
