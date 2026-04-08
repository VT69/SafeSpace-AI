import { Navigation2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

function RiskDot({ score }) {
  const color = score < 35 ? '#22c55e' : score < 65 ? '#f59e0b' : '#ef4444'
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    }} />
  )
}

export default function RoutePanel({ routeData, loading, origin, destination }) {
  if (!origin && !destination && !loading) return null

  return (
    <div className="glass-card" style={{ margin: '12px 16px 0', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Navigation2 size={14} color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
          Safe Route
        </span>
        {routeData && (
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {(routeData.total_distance_m / 1000).toFixed(2)} km
          </span>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer" style={{ height: 36, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!loading && !routeData && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
          Enter a destination to see the safest route
        </div>
      )}

      {routeData && !loading && (
        <>
          {/* Summary row */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 14, padding: '10px 12px',
            background: 'rgba(34,197,94,0.08)', borderRadius: 10,
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <CheckCircle size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#22c55e' }}>{routeData.summary}</div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Risk cost: {routeData.risk_weighted_cost} · Total cost: {routeData.total_cost.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {routeData.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
                  <RiskDot score={step.risk_score} />
                  {i < routeData.steps.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 12, background: 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {step.instruction}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span><Clock size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />{(step.distance_m / 1000).toFixed(2)} km</span>
                    <span style={{ color: step.risk_color, fontWeight: 500 }}>{step.risk_level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
