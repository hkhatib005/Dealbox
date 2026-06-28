import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, X, Edit2, Trash2, CheckCircle, Package, ChevronDown } from 'lucide-react'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const DEAL_TYPES = ['Foreclosure','Probate','Tax Delinquent','Absentee Owner','Short Sale','REO']
const PROPERTY_TYPES = ['Single Family','Duplex','Triplex','Fourplex','Multi-Family','Condo','Townhouse']
const CONDITIONS = ['Distressed','Fair','Good','Excellent']

export default function BuyBoxes() {
  const [boxes, setBoxes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBox, setEditingBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => { loadBoxes() }, [])

  const loadBoxes = async () => {
    try {
      const res = await api.get('/buybox/')
      setBoxes(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (editingBox) {
        await api.put(`/buybox/${editingBox.id}`, data)
        showToast('Buy box updated!')
      } else {
        await api.post('/buybox/', data)
        showToast('Buy box created — matching deals now!')
      }
      setShowModal(false); setEditingBox(null)
      loadBoxes()
    } catch(e) { showToast(e.response?.data?.error || 'Failed to save', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this buy box?')) return
    await api.delete(`/buybox/${id}`)
    showToast('Buy box deleted')
    loadBoxes()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Buy Boxes</h1>
          <p>Define what deals you're looking for — we'll find them automatically</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingBox(null); setShowModal(true) }}>
          <Plus size={16}/> New Buy Box
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      ) : boxes.length === 0 ? (
        <div className="card empty-state">
          <Package size={48} />
          <h3>No Buy Boxes Yet</h3>
          <p style={{ marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
            Tell us what you're looking for and we'll automatically find matching distressed properties.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15}/> Create Your First Buy Box</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {boxes.map(box => (
            <BuyBoxCard key={box.id} box={box}
              onEdit={() => { setEditingBox(box); setShowModal(true) }}
              onDelete={() => handleDelete(box.id)} />
          ))}
          <button className="card" onClick={() => { setEditingBox(null); setShowModal(true) }}
            style={{ border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text3)', minHeight: 200, transition: 'all 0.15s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Plus size={28} />
            <span style={{ fontWeight: 600 }}>Add Buy Box</span>
          </button>
        </div>
      )}

      {showModal && (
        <BuyBoxModal
          box={editingBox}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingBox(null) }}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? <CheckCircle size={16}/> : <X size={16}/>}{toast.msg}</div>}
    </div>
  )
}

function BuyBoxCard({ box, onEdit, onDelete }) {
  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{box.name}</div>
          <div className={`badge ${box.active ? 'badge-green' : 'badge-red'}`}>{box.active ? 'Active' : 'Paused'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}><Edit2 size={13}/></button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}><Trash2 size={13}/></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>PRICE RANGE</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#34d399' }}>
            ${(box.min_price/1000).toFixed(0)}k – ${(box.max_price/1000).toFixed(0)}k
          </div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>BEDS / BATHS</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{box.min_beds}–{box.max_beds} bd · {box.min_baths}+ ba</div>
        </div>
      </div>

      {box.states?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>STATES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {box.states.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
          </div>
        </div>
      )}

      {box.deal_types?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>DEAL TYPES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {box.deal_types.map(d => <span key={d} className="badge badge-amber">{d}</span>)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>
          <strong style={{ color: '#60a5fa', fontSize: 18 }}>{box.match_count}</strong> matches found
        </span>
        <a href="/deals" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>View deals →</a>
      </div>
    </div>
  )
}

function MultiSelect({ label, options, value, onChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => (
          <span key={opt} className={`tag ${value.includes(opt) ? 'active' : ''}`} onClick={() => toggle(opt)}>
            {value.includes(opt) && <CheckCircle size={11}/>} {opt}
          </span>
        ))}
      </div>
    </div>
  )
}

function BuyBoxModal({ box, onSave, onClose }) {
  const [form, setForm] = useState({
    name: box?.name || 'My Buy Box',
    zip_codes: box?.zip_codes || [],
    states: box?.states || [],
    min_price: box?.min_price ?? 50000,
    max_price: box?.max_price ?? 400000,
    min_beds: box?.min_beds ?? 2,
    max_beds: box?.max_beds ?? 5,
    min_baths: box?.min_baths ?? 1,
    property_types: box?.property_types || ['Single Family'],
    conditions: box?.conditions || ['Distressed', 'Fair'],
    deal_types: box?.deal_types || ['Foreclosure', 'Probate', 'Tax Delinquent'],
    active: box?.active ?? true
  })
  const [zipInput, setZipInput] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key) => (val) => setForm(f => ({...f, [key]: val}))
  const setVal = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}))

  const addZip = () => {
    const z = zipInput.trim()
    if (z && !form.zip_codes.includes(z)) {
      setForm(f => ({...f, zip_codes: [...f.zip_codes, z]}))
    }
    setZipInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({...form, min_price: Number(form.min_price), max_price: Number(form.max_price),
      min_beds: Number(form.min_beds), max_beds: Number(form.max_beds), min_baths: Number(form.min_baths)})
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{box ? 'Edit Buy Box' : 'Create Buy Box'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Buy Box Name</label>
            <input value={form.name} onChange={setVal('name')} placeholder="e.g. Texas Distressed SFR" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Price</label>
              <input type="number" value={form.min_price} onChange={setVal('min_price')} min={0} />
            </div>
            <div className="form-group">
              <label>Max Price</label>
              <input type="number" value={form.max_price} onChange={setVal('max_price')} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Beds</label>
              <select value={form.min_beds} onChange={setVal('min_beds')}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Max Beds</label>
              <select value={form.max_beds} onChange={setVal('max_beds')}>
                {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <MultiSelect label="Target States" options={STATES} value={form.states} onChange={set('states')} />
          
          <div className="form-group">
            <label>Zip Codes (optional — leave empty for all zips in selected states)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={zipInput} onChange={e => setZipInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
                placeholder="e.g. 75204" style={{ flex: 1 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addZip}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.zip_codes.map(z => (
                <span key={z} className="tag active" onClick={() => setForm(f => ({...f, zip_codes: f.zip_codes.filter(v => v !== z)}))}>
                  {z} <X size={10}/>
                </span>
              ))}
            </div>
          </div>

          <MultiSelect label="Deal Types" options={DEAL_TYPES} value={form.deal_types} onChange={set('deal_types')} />
          <MultiSelect label="Property Types" options={PROPERTY_TYPES} value={form.property_types} onChange={set('property_types')} />
          <MultiSelect label="Condition" options={CONDITIONS} value={form.conditions} onChange={set('conditions')} />

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? <><div className="spinner" style={{width:15,height:15}}/> Saving...</> : (box ? 'Save Changes' : 'Create & Start Matching')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
