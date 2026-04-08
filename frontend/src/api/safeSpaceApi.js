import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Fetch risk score for a location.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [hour]  – defaults to server current hour
 * @param {number} [crowd_density=0.5]
 * @param {number} [crime_score=0.3]
 */
export async function fetchRiskScore({ lat, lon, hour, crowd_density = 0.5, crime_score = 0.3 }) {
  const { data } = await api.post('/risk-score', {
    lat, lon, hour, crowd_density, crime_score,
  })
  return data
}

/**
 * Fetch safe route between two points.
 * @param {{ lat, lon }} origin
 * @param {{ lat, lon }} destination
 * @param {number} [hour]
 */
export async function fetchSafeRoute({ origin, destination, hour }) {
  const { data } = await api.post('/safe-route', { origin, destination, hour })
  return data
}

/**
 * Trigger SOS alert.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [message]
 * @param {string} [contact_email]
 * @param {string} [user_name]
 */
export async function triggerSOS({ lat, lon, message, contact_email, user_name }) {
  const { data } = await api.post('/sos', { lat, lon, message, contact_email, user_name })
  return data
}
