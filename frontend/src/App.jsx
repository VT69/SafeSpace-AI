import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Search, Locate, ChevronRight } from 'lucide-react'
import { fetchRiskScore, fetchSafeRoute } from '../api/safeSpaceApi'
import { useLocation } from './hooks/useLocation'
import { useRiskScore } from './hooks/useRiskScore'
import Navbar from './components/Navbar'
import MapView from './components/MapView'
import RiskPanel from './components/RiskPanel'
import SOSButton from './components/SOSButton'
import RoutePanel from './components/RoutePanel'

// Simple geocode using Nominatim (no key required)
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name }
}

export default function App() {
  const { coords, error: locError, loading: locLoading, refresh: refreshLoc } = useLocation()
  const { riskData, loading: riskLoading, error: riskError, evaluate } = useRiskScore()

  const [destInput, setDestInput]   = useState('')
  const [destination, setDest]       = useState(null)  // { lat, lon, label }
  const [routeData, setRouteData]    = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [destError, setDestError]    = useState('')
  const searchTimer = useRef(null)

  // Auto-evaluate risk when location changes
  useEffect(() => {
    if (coords) {
      evaluate({ lat: coords.lat, lon: coords.lon }, 300)
    }
  }, [coords, evaluate])

  async function handleSearch(e) {
    e.preventDefault()
    if (!destInput.trim()) return
    setDestError('')
    setRouteLoading(true)
    try {
      const dest = await geocode(destInput)
      setDest(dest)

      // Fetch route
      if (coords) {
        const [routeRes] = await Promise.all([
          fetchSafeRoute({ origin: { lat: coords.lat, lon: coords.lon }, destination: dest }),
        ])
        setRouteData(routeRes)
      }
    } catch (e) {
      setDestError(e.message || 'Could not find destination')
    } finally {
      setRouteLoading(false)
    }
  }

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <Navbar coords={coords} locationLoading={locLoading} />

        {/* Destination input */}
        <div style={{ padding: '14px 16px 0' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="modern-input"
                style={{ paddingLeft: 30 }}
                placeholder="Enter destination…"
                value={destInput}
                onChange={e => setDestInput(e.target.value)}
                id="destination-input"
                autoComplete="off"
              />
            </div>
            <button type="submit" disabled={routeLoading || !destInput.trim()}
              aria-label="Find safe route"
              style={{
                padding: '0 14px', borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', cursor: 'pointer',
                opacity: !destInput.trim() || routeLoading ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}>
              <Search size={15} color="white" />
            </button>
          </form>
          {destError && (
            <div style={{ fontSize: '0.73rem', color: '#f87171', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ChevronRight size={11} /> {destError}
            </div>
          )}
          {destination && !destError && (
            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ChevronRight size={11} color="#22d3ee" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {destination.label}
              </span>
            </div>
          )}
        </div>

        {/* Location status */}
        {locError && (
          <div style={{ margin: '10px 16px 0', padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: '0.73rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠ {locError} – using default location
              <button onClick={refreshLoc} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Locate size={11} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Risk Panel */}
        <RiskPanel riskData={riskData} loading={riskLoading} />

        {/* Route Panel */}
        <RoutePanel
          routeData={routeData}
          loading={routeLoading}
          origin={coords}
          destination={destination}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* SOS Section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 20 }}>
          <div style={{ padding: '12px 16px 0', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Emergency
          </div>
          <SOSButton coords={coords} />
        </div>
      </aside>

      {/* ── Map ─────────────────────────────────────────────── */}
      <main className="map-container">
        <MapView
          coords={coords}
          destination={destination}
          routeData={routeData}
          riskData={riskData}
        />
      </main>
    </div>
  )
}
