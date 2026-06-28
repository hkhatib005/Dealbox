import { useState, useEffect } from 'react'
import api from '../api'
import { Users, Package, Home, TrendingUp, Plus, X, Trash2, RefreshCw, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Key, UserX } from 'lucide-react'

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [buyboxes, setBuyboxes] = useState([])
  const [properties, setProperties] = useState([])
  const [inviteCodes, setInviteCodes] = useState([])
  const [showAddProp, setShowAddProp] = useState(false)
  const [toast, setToast] = useState(null)
  const [expandedUser, setExpandedUser] = useState(null)

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [s, u, pend, b, p, codes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/users/pending'),
        api.get('/admin/buyboxes'),
        api.get('/admin/properties'),
        api.get('/admin/invite-codes'),
      ])
      setStats(s.data); setUsers(u.data); setPending(pend.data)
      setBuyboxes(b.data); setProperties(p.data); setInviteCodes(codes.data)
    } catch(e) { console.error(e) }
  }

  const handleRefreshScraper = async () => {
    try {
      const res = await api.post('/properties/refresh')
      showToast(res.data.message)
      loadAll()
    } catch(e) { showToast('Failed to refresh', 'error') }
  }

  const handleDeleteProp = async (id) => {
    await api.delete(`/admin/properties/${id}`)
    showToast('Property removed')
    setProperties(p => p.filter(x => x.id !== id))
  }

  const handleApprove = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/approve`)
      showToast(res.data.message)
      setPending(p => p.filter(u => u.id !== userId))
      loadAll()
    } catch(e) { showToast('Failed to approve', 'error') }
  }

  const handleReject = async (userId, name) => {
    if (!confirm(`Remove ${name}'s account? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${userId}`)
      showToast('User removed')
      setPending(p => p.filter(u => u.id !== userId))
      loadAll()
    } catch(e) { showToast('Failed to remove', 'error') }
  }

  const handleSuspend = async (userId, name, isApproved) => {
    const action = isApproved ? 'suspend' : 'restore'
    if (isApproved && !confirm(`Suspend ${name}? They will lose platform access.`)) return
    try {
      const endpoint = isApproved ? `/admin/users/${userId}/suspend` : `/admin/users/${userId}/approve`
      const res = await api.post(endpoint)
      showToast(res.data.message)
      loadAll()
    } catch(e) { showToast(`Failed to ${action}`, 'error') }
  }

  const handleGenerateCode = async () => {
    try {
      const res = await api.post('/admin/invite-codes')
      showToast(`Code generated: ${res.data.code}`)
      setInviteCodes(c => [res.data, ...c])
    } catch(e) { showToast('Failed to generate', 'error') }
  }

  const handleDeactivateCode = async (codeId) => {
    try {
      await api.delete(`/admin/invite-codes/${codeId}`)
      showToast('Code deactivated')
      setInviteCodes(c => c.map(x => x.id === codeId ? {...x, active: false} : x))
    } catch(e) { showToast('Failed', 'error') }
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'pending', label: `Pending (${pending.length})`, icon: Clock, badge: pending.length > 0 },
    { id: 'users', label: `Users (${users.filter(u=>u.role!=='admin').length})`, icon: Users },
    { id: 'invites', label: 'Invite Codes', icon: Key },
    { id: 'buyboxes', label: `Buy Boxes (${buyboxes.length})`, icon: Package },
    { id: 'properties', label: `Properties (${properties.length})`, icon: Home },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Full platform visibility — all users, buy boxes, and properties</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}><RefreshCw size={14}/> Refresh</button>
          <button className="btn btn-success btn-sm" onClick={handleRefreshScraper}><RefreshCw size={14}/> Run Scraper</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === id ? 'var(--accent)' : 'var(--text2)',
              background: tab === id ? 'rgba(59,130,246,0.08)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 6, position: 'relative'
            }}>
            <Icon size={14}/> {label}
            {badge && <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#f87171',
              position: 'absolute', top: 6, right: 6
            }}/>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div>
          <div className="stat-grid">
            <div className="stat-card"><div className="label">Wholesalers</div><div className="value" style={{color:'#60a5fa'}}>{stats.total_users}</div></div>
            <div className="stat-card" style={stats.pending_approvals > 0 ? {borderColor:'rgba(251,191,36,0.4)'} : {}}>
              <div className="label">Pending Approval</div>
              <div className="value" style={{color: stats.pending_approvals > 0 ? '#fbbf24' : '#34d399'}}>{stats.pending_approvals}</div>
            </div>
            <div className="stat-card"><div className="label">Buy Boxes</div><div className="value" style={{color:'#34d399'}}>{stats.total_buyboxes}</div></div>
            <div className="stat-card"><div className="label">Properties</div><div className="value" style={{color:'#fbbf24'}}>{stats.total_properties}</div></div>
            <div className="stat-card"><div className="label">Total Matches</div><div className="value" style={{color:'#a78bfa'}}>{stats.total_matches}</div></div>
          </div>

          {stats.pending_approvals > 0 && (
            <div className="card" style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={18} color="#fbbf24" />
                  <span style={{ fontWeight: 600 }}>{stats.pending_approvals} user{stats.pending_approvals > 1 ? 's' : ''} waiting for approval</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('pending')}>Review Now</button>
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Platform Health</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>MATCH RATE</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {stats.total_buyboxes > 0 ? Math.round(stats.total_matches / stats.total_buyboxes) : 0}
                  <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> avg/buybox</span>
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>ACTIVE BUY BOXES</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {stats.active_buyboxes}
                  <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / {stats.total_buyboxes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {tab === 'pending' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Pending Applications</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Review and approve or reject new wholesaler signups</p>
          </div>

          {pending.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <CheckCircle size={40} color="#34d399" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 600, marginBottom: 6 }}>All caught up!</div>
              <div style={{ color: 'var(--text3)', fontSize: 14 }}>No pending applications right now.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(user => (
                <div key={user.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 18, flexShrink: 0
                    }}>{user.name?.[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{user.email}</div>
                      {user.phone && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user.phone}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginRight: 8 }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(user.id)} style={{ gap: 6 }}>
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(user.id, user.name)} style={{ gap: 6 }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.filter(u => u.role !== 'admin').map(user => (
              <div key={user.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, cursor: 'pointer' }}
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: user.approved
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, flexShrink: 0
                  }}>{user.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.name}
                      <span className={`badge ${user.approved ? 'badge-green' : 'badge-red'}`} style={{fontSize:10}}>
                        {user.approved ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>{user.email} · {user.phone || 'No phone'}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{user.buybox_count}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>buy boxes</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>{user.total_matches}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>matches</div>
                  </div>
                  <button
                    className={`btn btn-sm ${user.approved ? 'btn-danger' : 'btn-success'}`}
                    style={{ gap: 4, marginRight: 4 }}
                    onClick={e => { e.stopPropagation(); handleSuspend(user.id, user.name, user.approved) }}
                  >
                    <UserX size={13}/>
                    {user.approved ? 'Suspend' : 'Restore'}
                  </button>
                  {expandedUser === user.id ? <ChevronUp size={16} color="var(--text3)"/> : <ChevronDown size={16} color="var(--text3)"/>}
                </div>
                {expandedUser === user.id && user.buyboxes?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 16, background: 'var(--bg3)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, fontWeight: 600 }}>BUY BOXES</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                      {user.buyboxes.map(b => (
                        <div key={b.id} style={{ padding: 12, background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>{b.name}</div>
                          <div style={{ color: 'var(--text3)', fontSize: 12 }}>
                            ${(b.min_price/1000).toFixed(0)}k – ${(b.max_price/1000).toFixed(0)}k · {b.min_beds}–{b.max_beds}bd
                          </div>
                          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {b.states?.map(s => <span key={s} className="badge badge-blue" style={{fontSize:10}}>{s}</span>)}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: '#34d399' }}>{b.match_count} matches</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Codes */}
      {tab === 'invites' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Invite Codes</h2>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Generate codes for instant access — each code can only be used once</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleGenerateCode} style={{ gap: 6 }}>
              <Key size={14}/> Generate Code
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inviteCodes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Key size={32} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text3)', fontSize: 14 }}>No invite codes yet. Generate one above.</div>
              </div>
            ) : inviteCodes.map(code => (
              <div key={code.id} className="card" style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16,
                opacity: code.active ? 1 : 0.5
              }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.12em',
                  color: code.active ? '#60a5fa' : 'var(--text3)',
                  background: 'var(--bg3)', padding: '6px 12px', borderRadius: 6
                }}>{code.code}</div>
                <div style={{ flex: 1 }}>
                  {code.used_by ? (
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                      Used by <strong style={{ color: 'var(--text2)' }}>{code.used_by}</strong>
                      {code.used_at && ` on ${new Date(code.used_at).toLocaleDateString()}`}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: code.active ? '#34d399' : 'var(--text3)' }}>
                      {code.active ? 'Available' : 'Deactivated'}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Created {new Date(code.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge ${code.used_by ? 'badge-blue' : code.active ? 'badge-green' : 'badge-red'}`}>
                  {code.used_by ? 'Used' : code.active ? 'Active' : 'Disabled'}
                </span>
                {code.active && !code.used_by && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivateCode(code.id)} title="Deactivate">
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Boxes */}
      {tab === 'buyboxes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {buyboxes.map(b => (
            <div key={b.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                    <span className={`badge ${b.active ? 'badge-green' : 'badge-red'}`}>{b.active ? 'Active' : 'Paused'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                    By: <strong style={{color:'var(--text2)'}}>{b.user?.name}</strong> ({b.user?.email})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>${(b.min_price/1000).toFixed(0)}k–${(b.max_price/1000).toFixed(0)}k</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>{b.min_beds}–{b.max_beds}bd</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>{b.match_count}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>matches</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 200 }}>
                  {b.states?.slice(0,6).map(s => <span key={s} className="badge badge-blue" style={{fontSize:10}}>{s}</span>)}
                  {b.states?.length > 6 && <span className="badge badge-blue" style={{fontSize:10}}>+{b.states.length-6}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Properties */}
      {tab === 'properties' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowAddProp(true)}><Plus size={15}/> Add Property</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {properties.map(p => (
              <div key={p.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.address}, {p.city}, {p.state} {p.zip_code}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
                    {p.deal_type} · {p.condition} · {p.source}
                    {p.owner_name && ` · Owner: ${p.owner_name}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: '#34d399' }}>${p.price?.toLocaleString()}</div>
                  {p.beds && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.beds}bd/{p.baths}ba</div>}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProp(p.id)}><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddProp && <AddPropertyModal onClose={() => setShowAddProp(false)} onSave={async (data) => {
        try {
          await api.post('/admin/properties', data)
          showToast('Property added and matched!')
          setShowAddProp(false)
          loadAll()
        } catch(e) { showToast('Failed to add', 'error') }
      }} />}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

function AddPropertyModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    address:'', city:'', state:'', zip_code:'', price:'', beds:'3', baths:'2',
    sqft:'', property_type:'Single Family', condition:'Distressed',
    deal_type:'Foreclosure', owner_name:'', description:'',
    lat:'', lng:'', source:'Manual', arv_estimate:''
  })
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    await onSave({...form,
      price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
      sqft: Number(form.sqft), lat: Number(form.lat), lng: Number(form.lng),
      arv_estimate: Number(form.arv_estimate)
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Property</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={set('address')} placeholder="123 Main St" required /></div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} required /></div>
            <div className="form-group"><label>State</label><input value={form.state} onChange={set('state')} placeholder="TX" maxLength={2} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Zip Code</label><input value={form.zip_code} onChange={set('zip_code')} /></div>
            <div className="form-group"><label>Price ($)</label><input type="number" value={form.price} onChange={set('price')} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Beds</label><input type="number" value={form.beds} onChange={set('beds')} /></div>
            <div className="form-group"><label>Baths</label><input type="number" value={form.baths} onChange={set('baths')} step="0.5" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Deal Type</label>
              <select value={form.deal_type} onChange={set('deal_type')}>
                {['Foreclosure','Probate','Tax Delinquent','Absentee Owner','Short Sale','REO'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Condition</label>
              <select value={form.condition} onChange={set('condition')}>
                {['Distressed','Fair','Good','Excellent'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Lat</label><input type="number" value={form.lat} onChange={set('lat')} step="any" /></div>
            <div className="form-group"><label>Lng</label><input type="number" value={form.lng} onChange={set('lng')} step="any" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>ARV Estimate ($)</label><input type="number" value={form.arv_estimate} onChange={set('arv_estimate')} /></div>
            <div className="form-group"><label>Owner Name</label><input value={form.owner_name} onChange={set('owner_name')} /></div>
          </div>
          <div className="form-group"><label>Source</label><input value={form.source} onChange={set('source')} /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={set('description')} rows={3} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? 'Adding...' : 'Add & Match Property'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
