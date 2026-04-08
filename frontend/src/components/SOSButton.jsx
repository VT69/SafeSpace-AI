import { useState, useRef } from 'react'
import { AlertTriangle, Phone, X, CheckCircle } from 'lucide-react'
import { triggerSOS } from '../api/safeSpaceApi'

const STATES = { idle: 'idle', confirm: 'confirm', sending: 'sending', sent: 'sent', error: 'error' }

export default function SOSButton({ coords }) {
  const [state, setState]   = useState(STATES.idle)
  const [alertId, setAlertId] = useState(null)
  const [errMsg, setErrMsg] = useState('')
  const [countdown, setCountdown] = useState(5)
  const timer = useRef(null)

  function handlePress() {
    setState(STATES.confirm)
    let c = 5
    setCountdown(c)
    timer.current = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(timer.current)
        sendSOS()
      }
    }, 1000)
  }

  function handleCancel() {
    clearInterval(timer.current)
    setState(STATES.idle)
    setCountdown(5)
  }

  async function sendSOS() {
    setState(STATES.sending)
    try {
      const res = await triggerSOS({
        lat: coords?.lat ?? 12.9716,
        lon: coords?.lon ?? 77.5946,
        message: 'EMERGENCY – I need immediate help!',
      })
      setAlertId(res.alert_id)
      setState(STATES.sent)
      // Auto-reset after 8 seconds
      setTimeout(() => setState(STATES.idle), 8000)
    } catch (e) {
      setErrMsg(e?.response?.data?.detail || 'Failed to send alert. Try again.')
      setState(STATES.error)
    }
  }

  if (state === STATES.sent) {
    return (
      <div className="glass-card fade-in-up" style={{ margin: '12px 16px', padding: 20, textAlign: 'center' }}>
        <CheckCircle size={36} color="#22c55e" style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#22c55e', marginBottom: 6 }}>
          Alert Sent Successfully
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
          Emergency services have been notified.<br />
          Stay calm and stay visible.
        </div>
        {alertId && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            ID: {alertId}
          </div>
        )}
      </div>
    )
  }

  if (state === STATES.confirm || state === STATES.sending) {
    return (
      <div className="glass-card fade-in-up" style={{ margin: '12px 16px', padding: 20, textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, color: '#f87171' }}>
          {state === STATES.sending ? '📡 Sending alert…' : `🆘 Sending in ${countdown}s…`}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          {state === STATES.sending ? 'Transmitting your location to emergency services.' : 'Your location will be shared with emergency contacts.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleCancel} disabled={state === STATES.sending}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: state === STATES.sending ? 0.4 : 1,
            }}>
            <X size={14} /> Cancel
          </button>
          <button onClick={() => { clearInterval(timer.current); sendSOS() }}
            disabled={state === STATES.sending}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: 'none', color: 'white', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: state === STATES.sending ? 0.7 : 1,
            }}>
            <Phone size={14} /> Send Now
          </button>
        </div>
      </div>
    )
  }

  if (state === STATES.error) {
    return (
      <div className="glass-card" style={{ margin: '12px 16px', padding: 16, border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <AlertTriangle size={16} color="#f87171" />
          <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>Alert Failed</span>
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{errMsg}</div>
        <button onClick={() => setState(STATES.idle)} className="btn-primary">Try Again</button>
      </div>
    )
  }

  // Idle state – main SOS button
  return (
    <div style={{ margin: '16px 16px 0', textAlign: 'center' }}>
      <div style={{ marginBottom: 16, position: 'relative', display: 'inline-block' }}>
        <button
          className="sos-btn"
          onClick={handlePress}
          aria-label="Send SOS emergency alert"
          style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}
        >
          <span className="sos-ring" />
          <span className="sos-ring sos-ring-2" />
          <Phone size={24} color="white" strokeWidth={2.5} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'white' }}>SOS</span>
        </button>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Tap to send emergency alert<br />with your current location
      </div>
    </div>
  )
}
