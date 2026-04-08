import { useState, useEffect, useCallback } from 'react'

/**
 * useLocation – watches browser geolocation.
 * Returns { coords, error, loading, refresh }
 */
export function useLocation() {
  const [coords, setCoords]   = useState(null)   // { lat, lon, accuracy }
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  const onSuccess = useCallback((pos) => {
    setCoords({
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    })
    setError(null)
    setLoading(false)
  }, [])

  const onError = useCallback((err) => {
    setError(err.message)
    setLoading(false)
    // Fallback: Bangalore city center
    setCoords({ lat: 12.9716, lon: 77.5946, accuracy: null })
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      setCoords({ lat: 12.9716, lon: 77.5946, accuracy: null })
      return
    }
    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 8_000,
    })
    return () => navigator.geolocation.clearWatch(id)
  }, [onSuccess, onError])

  const refresh = useCallback(() => {
    setLoading(true)
    navigator.geolocation?.getCurrentPosition(onSuccess, onError)
  }, [onSuccess, onError])

  return { coords, error, loading, refresh }
}
