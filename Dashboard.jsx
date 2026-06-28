import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import { Package, TrendingUp, Bookmark, Bell, ArrowRight, MapPin, Bed, Bath, DollarSign, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DEAL_COLORS = {
  'Foreclosure': '#3b82f6',
  'Probate': '#10b981',
  'Tax Delinquent': '#f59e0b',
  'Absentee Owner': '#8b5cf6',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentDeals, setRecentDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, dealsRes] = await Promise.all([
        api.get('/properties/stats'),
        api.get('/properties/?per_page=6')
      ])
      setStats(statsRes.data)
      setRecentDeals(dealsRes.data.properties || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const isAdmin = user?.role === 'admin'
  const chartData = stats?.by_deal_type || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening in your deal pipeline</p>
        </div>
        <button onClick={loadData} className="btn btn-ghost btn-sm"><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {isAdmin ? <>
          <div className="stat-card">
            <div className="label">Total Users</div>
            <div className="value" style={{ color: '#60a5fa' }}>{stats?.total_users ?? 0}</div>
            <div className="sub">Wholesalers on platform</div>
          </div>
          <div className="stat-card">
            <div className="label">Buy Boxes</div>
            <div className="value" style={{ color: '#34d399' }}>{stats?.total_buyboxes ?? 0}</div>
            <div className="sub">Active criteria sets</div>
          </div>
          <div className="stat-card">
            <div className="label">Properties</div>
            <div className="value" style={{ color: '#fbbf24' }}>{stats?.total_properties ?? 0}</div>
            <div className="sub">In the database</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Matches</div>
            <div className="value" style={{ color: '#a78bfa' }}>{stats?.total_matches ?? 0}</div>
            <div className="sub">Deal-buyer connections</div>
          </div>
        </> : <>
          <div className="stat-card">
            <div className="label">My Buy Boxes</div>
            <div className="value" style={{ color: '#60a5fa' }}>{stats?.total_buyboxes ?? 0}</div>
            <div className="sub">Active criteria</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Matches</div>
            <div className="value" style={{ color: '#34d399' }}>{stats?.total_matches ?? 0}</div>
            <div className="sub">Properties found</div>
          </div>
          <div className="stat-card">
            <div className="label">New Matches</div>
            <div className="value" style={{ color: '#fbbf24' }}>{stats?.new_matches ?? 0}</div>
            <div className="sub">Since last visit</div>
          </div>
          <div className="stat-card">
            <div className="label">Saved Deals</div>
            <div className="value" style={{ color: '#a78bfa' }}>{stats?.saved_deals ?? 0}</div>
            <div className="sub">In your watchlist</div>
          </div>
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent Deals */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Deals</h2>
            <Link to="/deals" className="btn btn-ghost btn-sm">View All <ArrowRight size={14}/></Link>
          </div>
          {recentDeals.length === 0 ? (
            <div className="card empty-state">
              <Package size={40} />
              <h3>No matches yet</h3>
              <p style={{ marginBottom: 16 }}>Set up a buy box to start seeing deals</p>
              <Link to="/buyboxes" className="btn btn-primary">Create Buy Box</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div>
          {isAdmin && chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Properties by Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="type" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={DEAL_COLORS[entry.type] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/buyboxes" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                <Package size={15}/> Create Buy Box
              </Link>
              <Link to="/deals" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                <TrendingUp size={15}/> Browse All Deals
              </Link>
              <Link to="/map" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                <MapPin size={15}/> Open Map View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DealCard({ deal }) {
  const badgeMap = {
    'Foreclosure': 'badge-blue',
    'Probate': 'badge-green',
    'Tax Delinquent': 'badge-amber',
    'Absentee Owner': 'badge-purple',
  }
  return (
    <div className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, #1a2235, #0a0f1e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <MapPin size={20} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className={`badge ${badgeMap[deal.deal_type] || 'badge-blue'}`}>{deal.deal_type}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{deal.source}</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.address}, {deal.city}, {deal.state}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)' }}>
          <span style={{ color: '#34d399', fontWeight: 700 }}>${deal.price?.toLocaleString()}</span>
          {deal.beds && <span><Bed size={12}/> {deal.beds}bd</span>}
          {deal.baths && <span><Bath size={12}/> {deal.baths}ba</span>}
          {deal.arv_estimate && <span style={{ color: 'var(--text3)' }}>ARV: ${deal.arv_estimate?.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}
