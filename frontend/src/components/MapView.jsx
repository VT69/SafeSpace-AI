import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api'
import { AlertTriangle } from 'lucide-react'

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2535' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0e131f' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0f1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1e40af' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1a0d' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e2535' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
]

const CONTAINER_STYLE = { width: '100%', height: '100%' }

function getRiskPolylineColor(score) {
  if (score < 35) return '#22c55e'
  if (score < 65) return '#f59e0b'
  return '#ef4444'
}

/**
 * MapView – renders Google Maps with current location, destination, and route.
 * Falls back to a styled placeholder if no API key is configured.
 */
export default function MapView({ coords, destination, routeData, riskData }) {
  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const hasKey = MAPS_KEY && MAPS_KEY !== 'your_google_maps_api_key_here'

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: hasKey ? MAPS_KEY : '',
    libraries: ['places'],
  })

  const mapRef = useRef(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const onLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  // Pan to user location when coords change
  useEffect(() => {
    if (mapRef.current && coords) {
      mapRef.current.panTo({ lat: coords.lat, lng: coords.lon })
    }
  }, [coords])

  // Fit bounds when route is available
  useEffect(() => {
    if (mapRef.current && routeData?.polyline?.length) {
      const bounds = new window.google.maps.LatLngBounds()
      routeData.polyline.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
      mapRef.current.fitBounds(bounds, { padding: 60 })
    }
  }, [routeData])

  if (!hasKey) return <MapPlaceholder coords={coords} riskData={riskData} />
  if (loadError) return <MapPlaceholder coords={coords} riskData={riskData} error />
  if (!isLoaded) return <MapLoading />

  const center = coords
    ? { lat: coords.lat, lng: coords.lon }
    : { lat: 12.9716, lng: 77.5946 }

  // Build coloured polyline segments per step
  const segments = routeData?.polyline
    ? routeData.polyline.slice(0, -1).map((p, i) => ({
        path: [
          { lat: p.lat, lng: p.lng },
          { lat: routeData.polyline[i + 1].lat, lng: routeData.polyline[i + 1].lng },
        ],
        score: routeData.steps?.[i]?.risk_score ?? 0,
      }))
    : []

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={14}
      onLoad={onLoad}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Current location marker */}
      {coords && (
        <Marker
          position={{ lat: coords.lat, lng: coords.lon }}
          onClick={() => setInfoOpen(true)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2.5,
          }}
        />
      )}
      {infoOpen && coords && (
        <InfoWindow
          position={{ lat: coords.lat, lng: coords.lon }}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div style={{ color: '#111', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
            <strong>📍 Your Location</strong>
            <div>{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</div>
            {riskData && (
              <div style={{ marginTop: 4, fontWeight: 600, color: riskData.color }}>
                Risk: {riskData.level} ({riskData.score})
              </div>
            )}
          </div>
        </InfoWindow>
      )}

      {/* Destination marker */}
      {destination?.lat && (
        <Marker
          position={{ lat: destination.lat, lng: destination.lon }}
          icon={{
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#22d3ee',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      )}

      {/* Risk-coloured route segments */}
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          path={seg.path}
          options={{
            strokeColor: getRiskPolylineColor(seg.score),
            strokeOpacity: 0.85,
            strokeWeight: 5,
          }}
        />
      ))}
    </GoogleMap>
  )
}

/* ── Fallback components ────────────────────────────────────────────── */

function MapLoading() {
  return (
    <div style={centeredStyle}>
      <div className="shimmer" style={{ width: 300, height: 24, borderRadius: 8, marginBottom: 12 }} />
      <div className="shimmer" style={{ width: 200, height: 16, borderRadius: 8 }} />
    </div>
  )
}

function MapPlaceholder({ coords, riskData, error }) {
  const riskColor = riskData?.color || '#3b82f6'
  return (
    <div style={{ ...centeredStyle, flexDirection: 'column', gap: 20, background: '#080b14' }}>
      <AlertTriangle size={36} color="#f59e0b" />
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
          {error ? 'Map Error' : 'Google Maps API Key Required'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Add your API key to <code style={{ color: '#22d3ee' }}>frontend/.env</code>
          <br />
          <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            VITE_GOOGLE_MAPS_API_KEY=your_key_here
          </code>
        </div>
      </div>
      {coords && (
        <div className="glass-card" style={{ padding: '14px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Location</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: 4, color: '#22d3ee' }}>
            {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </div>
        </div>
      )}
      {riskData && (
        <div className="glass-card" style={{ padding: '14px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risk Level</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: riskColor }}>
            {riskData.score}<span style={{ fontSize: '1rem', fontWeight: 400 }}>/100</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: riskColor, fontWeight: 600 }}>{riskData.level}</div>
        </div>
      )}
    </div>
  )
}

const centeredStyle = {
  width: '100%', height: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#080b14',
}
