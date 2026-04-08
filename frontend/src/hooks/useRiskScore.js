import { useState, useCallback, useRef } from 'react'
import { fetchRiskScore } from '../api/safeSpaceApi'

/**
 * useRiskScore – fetches risk from the backend with debounce.
 * Returns { riskData, loading, error, evaluate }
 */
export function useRiskScore() {
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const timerRef = useRef(null)

  const evaluate = useCallback(async (params, delay = 0) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchRiskScore(params)
        setRiskData(data)
      } catch (e) {
        setError(e?.response?.data?.detail || e.message || 'API error')
      } finally {
        setLoading(false)
      }
    }, delay)
  }, [])

  return { riskData, loading, error, evaluate }
}
