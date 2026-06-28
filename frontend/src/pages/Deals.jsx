import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { MapPin, Bed, Bath, Square, ExternalLink, Bookmark, BookmarkCheck, Filter, Search, Home, TrendingUp } from 'lucide-react'

const DEAL_TYPES = ['All','Foreclosure','Probate','Tax Delinquent','Absentee Owner','Short Sale','REO']
const BADGE = { 'Foreclosure':'badge-blue','Probate':'badge-green','Tax Delinquent':'badge-amber','Absentee Owner':'badge-purple','Short Sale':'badge-red','REO':'badge-blue' }

export default function Deals() {
  const [properties, setProperties] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({ deal_type: '', min_price: '', max_price: '', state: '' })
  const [search, setSearch] = useState('')
  const [savedIds, setSavedIds] = useState(new Set())

  useEffect(() => { load() }, [page, filters])

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 12 }
      if (filters.deal_type) params.deal_type = filters.deal_type
      if (filters.min_price) params.min_price = filters.min_price
      if (filters.max_price) params.max_price = filters.max_price
      if (filters.state) params.state = filters.state
      const res = await api.get('/properties/', { params })
      setProperties(res.data.properties || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const setFilter = (key, val) => {
    setFilters(f => ({...f, [key]: val}))
    setPage(1)
  }

  const displayed = search
    ? properties.filter(p =>
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase()) ||
        p.state?.toLowerCase().includes(search.toLowerCase()) ||
        p.owner_name?.toLowerCase().includes(search.toLowerCase())
      )
    : properties

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Deals</h1>
          <p>{total} properties matching your buy boxes</p>
        </div>
        <Link to="/map" className="btn btn-ghost btn-sm"><MapPin size={14}/> Map View</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 12, alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search address, city, owner..." style={{ paddingLeft: 36 }} />
          </div>
          <select value={filters.deal_type} onChange={e => setFilter('deal_type', e.target.value)} style={{ width: 180 }}>
            {DEAL_TYPES.map(t => <option key={t} value={t === 'All' ? '' : t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Min $" value={filters.min_price} onChange={e => setFilter('min_price', e.target.value)} style={{ width: 100 }} />
          <input type="number" placeholder="Max $" value={filters.max_price} onChange={e => setFilter('max_price', e.target.value)} style={{ width: 100 }} />
          <input placeholder="State (TX)" value={filters.state} onChange={e => setFilter('state', e.target.value.toUpperCase())} style={{ width: 80 }} maxLength={2} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: 'auto', width: 32, height: 32 }} /></div>
      ) : displayed.length === 0 ? (
        <div className="card empty-state">
          <Home size={48} />
          <h3>No deals found</h3>
          <p>Try adjusting your filters or <Link to="/buyboxes" style={{ color: 'var(--accent)' }}>update your buy box</Link></p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {displayed.map(p => (
              <PropertyCard key={p.id} property={p}
                saved={savedIds.has(p.id)}
                onSave={() => setSavedIds(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ padding: '6px 16px', background: 'var(--card)', borderRadius: 8, fontSize: 14, color: 'var(--text2)' }}>
                Page {page} of {pages}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PropertyCard({ property: p, saved, onSave }) {
  const profit = p.arv_estimate && p.price ? p.arv_estimate - p.price : null

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Header */}
      <div style={{
        height: 100, background: `linear-gradient(135deg, ${
          {'Foreclosure':'#1e3a5f,#1e4d7b','Probate':'#064e3b,#065f46','Tax Delinquent':'#78350f,#92400e','Absentee Owner':'#3b0764,#4c1d95'}[p.deal_type] || '#1e2d45,#1a2235'
        })`, padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
      }}>
        <span className={`badge ${BADGE[p.deal_type] || 'badge-blue'}`}>{p.deal_type}</span>
        <button onClick={onSave} style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>
          {saved ? <BookmarkCheck size={18}/> : <Bookmark size={18}/>}
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Address */}
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.address}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>
          <MapPin size={12}/> {p.city}, {p.state} {p.zip_code}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
          {p.beds && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={13}/>{p.beds} bd</span>}
          {p.baths && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={13}/>{p.baths} ba</span>}
          {p.sqft && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Square size={13}/>{p.sqft?.toLocaleString()} sqft</span>}
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>ASK PRICE</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk', color: '#34d399' }}>
              ${p.price?.toLocaleString()}
            </div>
          </div>
          {p.arv_estimate && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>EST. ARV</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>${p.arv_estimate?.toLocaleString()}</div>
              {profit && <div style={{ fontSize: 11, color: '#34d399' }}>+${profit?.toLocaleString()} spread</div>}
            </div>
          )}
        </div>

        {/* Owner info */}
        {p.owner_name && (
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            <strong style={{ color: 'var(--text2)' }}>Owner:</strong> {p.owner_name}
          </div>
        )}

        {p.description && (
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 12 }}>
            {p.description.length > 120 ? p.description.slice(0, 120) + '...' : p.description}
          </div>
        )}

        {/* Source */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
          <ExternalLink size={11}/>
          {p.source_url ? (
            <a href={p.source_url} target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}>
              {p.source}
            </a>
          ) : (
            <span>{p.source}</span>
          )}
        </div>
      </div>
    </div>
  )
}
