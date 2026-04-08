import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'

const SEVERITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

function RiskGauge({ score, color }) {
  const radius = 50
  const circ = 2 * Math.PI * radius
  // Show only the top 75% arc (270 degrees)
  const arcLen = circ * 0.75
  const offset = arcLen - (score / 100) * arcLen
  const rotation = 135  // start angle

  return (
    <svg width={140} height={100} viewBox="0 0 140 105" style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle
        cx={70} cy={75} r={radius}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10}
        strokeDasharray={`${arcLen} ${circ - arcLen}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} 70 75)`}
      />
      {/* Fill */}
      <circle
        cx={70} cy={75} r={radius}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${arcLen} ${circ - arcLen}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(${rotation} 70 75)`}
        style={{
          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
          filter: `drop-shadow(0 0 8px ${color}80)`,
        }}
      />
      {/* Score text */}
      <text x={70} y={72} textAnchor="middle" fill={color}
        style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
        {score}
      </text>
      <text x={70} y={87} textAnchor="middle" fill="var(--text-muted)"
        style={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
        / 100
      </text>
    </svg>
  )
}

function FactorBar({ factor, importance, value, severity }) {
  const color = SEVERITY_COLOR[severity] || '#94a3c4'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '75%', lineHeight: 1.3 }}>{factor}</span>
        <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{importance}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: color,
          width: `${importance}%`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  )
}

export default function RiskPanel({ riskData, loading }) {
  const [expanded, setExpanded] = useState(true)

  const icon = useMemo(() => {
    if (!riskData) return <Minus size={14} />
    if (riskData.score < 35) return <TrendingDown size={14} color="#22c55e" />
    if (riskData.score < 65) return <Minus size={14} color="#f59e0b" />
    return <TrendingUp size={14} color="#ef4444" />
  }, [riskData])

  return (
    <div className="glass-card" style={{ margin: '12px 16px 0', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Info size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Risk Assessment
          </span>
        </div>
        {riskData && (
          <span className="risk-badge" style={{
            background: `${riskData.color}20`,
            color: riskData.color,
            border: `1px solid ${riskData.color}40`,
          }}>
            {icon}
            {riskData.level}
          </span>
        )}
      </div>

      {/* Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        {loading ? (
          <div className="shimmer" style={{ width: 140, height: 100, borderRadius: 12 }} />
        ) : riskData ? (
          <RiskGauge score={riskData.score} color={riskData.color} />
        ) : (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Enter a location to assess risk
          </div>
        )}
      </div>

      {/* Explanation accordion */}
      {riskData?.explanation?.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: '0.76rem', fontWeight: 500, marginBottom: expanded ? 12 : 0,
              transition: 'background 0.2s',
            }}
          >
            <span>Why is this the risk level?</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="fade-in-up">
              {riskData.explanation.map((item, i) => (
                <FactorBar key={i} {...item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
