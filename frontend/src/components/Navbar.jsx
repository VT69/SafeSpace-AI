import { Shield, MapPin, Wifi } from 'lucide-react'

export default function Navbar({ coords, locationLoading }) {
  return (
    <header style={{
      padding: '14px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(8,9,13,0.9)',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #3b82f6, #22d3ee)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(59,130,246,0.45)',
        }}>
          <Shield size={18} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }}>
            SafeSpace<span style={{ color: '#22d3ee' }}> AI</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Safety Assistant
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {coords && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <MapPin size={12} color="#22d3ee" />
            <span>{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: locationLoading ? '#f59e0b' : '#22c55e',
            display: 'inline-block',
            boxShadow: locationLoading ? '0 0 6px #f59e0b' : '0 0 8px #22c55e',
            animation: 'sos-pulse 2s ease-in-out infinite',
          }} />
          <span style={{ color: 'var(--text-muted)' }}>
            {locationLoading ? 'Locating…' : 'Live'}
          </span>
        </div>
      </div>
    </header>
  )
}
