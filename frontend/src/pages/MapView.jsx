import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '../api'
import { MapPin, DollarSign, Bed, Bath } from 'lucide-react'

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const colorMap = {
  'Foreclosure': '#3b82f6',
  'Probate': '#10b981',
  'Tax Delinquent': '#f59e0b',
  'Absentee Owner': '#8b5cf6',
}

function createColoredIcon(color) {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function MapView() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    api.get('/properties/?per_page=100').then(res => {
      setProperties((res.data.properties || []).filter(p => p.lat && p.lng))
    }).finally(() => setLoading(false))
  }, [])

  const DEAL_TYPES = ['All', 'Foreclosure', 'Probate', 'Tax Delinquent', 'Absentee Owner']
  const filtered = filter === 'All' ? properties : properties.filter(p => p.deal_type === filter)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Map View</h1>
          <p>{filtered.length} properties plotted nationwide</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {DEAL_TYPES.map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className="btn btn-sm"
            style={{
              background: filter === type ? (colorMap[type] || 'var(--accent)') : 'var(--bg3)',
              color: filter === type ? 'white' : 'var(--text2)',
              border: `1px solid ${filter === type ? 'transparent' : 'var(--border)'}`,
            }}>
            {type}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(colorMap).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {type}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: 'auto', width: 32, height: 32 }} /></div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', height: 580 }}>
          <MapContainer
            center={[37.8, -96]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {filtered.map(p => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createColoredIcon(colorMap[p.deal_type] || '#3b82f6')}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{p.address}</div>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>{p.city}, {p.state}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>${p.price?.toLocaleString()}</span>
                      {p.beds && <span>{p.beds}bd / {p.baths}ba</span>}
                    </div>
                    <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: colorMap[p.deal_type] + '25', color: colorMap[p.deal_type] || '#3b82f6' }}>
                      {p.deal_type}
                    </div>
                    {p.owner_name && <div style={{ marginTop: 6, fontSize: 11, color: '#888' }}>Owner: {p.owner_name}</div>}
                    {p.arv_estimate && <div style={{ marginTop: 4, fontSize: 11, color: '#3b82f6' }}>ARV: ${p.arv_estimate?.toLocaleString()}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Property count */}
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text3)', textAlign: 'right' }}>
        Showing {filtered.length} of {properties.length} properties
      </div>
    </div>
  )
}
