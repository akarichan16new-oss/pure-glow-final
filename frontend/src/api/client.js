/**
 * PureGlow AI - API Client
 * =========================
 *
 * Single source of truth for all backend API calls.
 * Every React component imports functions from this file
 * instead of writing fetch/axios calls inline.
 *
 * Usage:
 *   import { getRecommendations, getPalette, getHealth } from '../api/client'
 *
 *   const result = await getRecommendations({
 *     skin_type: 'oily',
 *     concerns: ['acne'],
 *     undertone: 'warm',
 *   })
 *
 * All functions return:
 *   Success  ->  { success: true, data: { ... } }
 *   Error    ->  { success: false, error: '...', message: '...' }
 */

import axios from 'axios'

// ============================================================================
// Axios instance -- all requests go through this
// ============================================================================

const api = axios.create({
  // In development, Vite proxies /api/* to localhost:5000 (see vite.config.js)
  // In production, set VITE_API_BASE_URL to your real API domain
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
})

// ============================================================================
// Response handler -- unwraps the { success, data } envelope
// ============================================================================

/**
 * Extract the data payload from the API response.
 * Throws a structured error object if the API returned success: false.
 */
function handleResponse(response) {
  const body = response.data

  // Our Flask API wraps everything in { success, data } or { success, error }
  if (body && body.success === true) {
    return body.data
  }

  // The API returned an error envelope
  const err = new Error(body?.message || 'API request failed')
  err.code = body?.error || 'unknown_error'
  err.status = response.status
  throw err
}

/**
 * Handle network/timeout/server errors gracefully.
 * Returns a consistent error shape so components never crash.
 */
function handleError(error) {
  // API returned an error response (4xx, 5xx)
  if (error.response) {
    const body = error.response.data
    return {
      success: false,
      error: body?.error || 'api_error',
      message: body?.message || `Server error (${error.response.status})`,
      status: error.response.status,
    }
  }

  // Network error (no response received)
  if (error.request) {
    return {
      success: false,
      error: 'network_error',
      message: 'Cannot reach the server. Make sure the Flask backend is running on port 5000.',
      status: 0,
    }
  }

  // Something else went wrong
  return {
    success: false,
    error: 'client_error',
    message: error.message || 'An unexpected error occurred.',
    status: 0,
  }
}

/**
 * Safe wrapper: calls the API, returns { success, data } on success
 * or { success, error, message } on failure. Never throws.
 */
async function safeCall(requestFn) {
  try {
    const response = await requestFn()
    const data = handleResponse(response)
    return { success: true, data }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================================
// Health & info endpoints
// ============================================================================

/**
 * GET /health -- full engine health report
 * Returns: { status, timestamp, stats, issues, engine }
 */
export async function getHealth() {
  return safeCall(() => api.get('/health'))
}

/**
 * GET /health/ping -- lightweight liveness check
 * Returns: { ping: 'pong', timestamp }
 */
export async function getPing() {
  return safeCall(() => api.get('/health/ping'))
}

/**
 * GET /api/info -- API metadata + valid input values
 * Returns: { name, version, endpoints, valid_inputs }
 *
 * Use valid_inputs to populate quiz dropdowns:
 *   const { data } = await getApiInfo()
 *   data.valid_inputs.skin_types    // ['oily', 'dry', 'combination', 'sensitive']
 *   data.valid_inputs.concerns      // ['acne', 'dark_spots', ...]
 *   data.valid_inputs.undertones    // ['warm', 'cool', 'neutral']
 */
export async function getApiInfo() {
  return safeCall(() => api.get('/api/info'))
}

/**
 * GET /api/stats -- engine and catalogue statistics
 * Returns: { engine_version, skincare: { n_products, n_brands, ... }, makeup: { ... } }
 */
export async function getStats() {
  return safeCall(() => api.get('/api/stats'))
}

// ============================================================================
// Recommendation endpoints
// ============================================================================

/**
 * POST /api/recommend -- full recommendation bundle
 *
 * @param {Object}   profile
 * @param {string}   profile.skin_type      Required: 'oily'|'dry'|'combination'|'sensitive'
 * @param {string[]} profile.concerns       Optional: ['acne','dark_spots','redness','dullness','aging','dryness']
 * @param {string}   profile.undertone      Optional: 'warm'|'cool'|'neutral'
 * @param {string}   profile.skin_tone      Optional: 'fair'|'light'|'medium'|'tan'|'dark'|'deep'
 * @param {number}   profile.top_n          Optional: default 5
 * @param {number}   profile.max_price      Optional: price cap
 * @param {string[]} profile.product_types  Optional: ['lipstick','blush'] (makeup filter)
 *
 * @returns {{ skincare_recommendations, makeup_recommendations, colour_palette, user_profile }}
 */
export async function getRecommendations(profile) {
  return safeCall(() => api.post('/api/recommend', profile))
}

/**
 * POST /api/skincare -- skincare-only recommendations
 *
 * @param {Object}   params
 * @param {string}   params.skin_type        Required
 * @param {string[]} params.concerns         Optional
 * @param {number}   params.top_n            Optional: default 10
 * @param {number}   params.max_price        Optional
 * @param {string[]} params.brands           Optional: brand whitelist
 * @param {string[]} params.exclude_brands   Optional: brand blacklist
 *
 * @returns {{ skin_type, concerns, total, products: [...] }}
 */
export async function getSkincare(params) {
  return safeCall(() => api.post('/api/skincare', params))
}

/**
 * POST /api/makeup -- makeup-only recommendations
 *
 * @param {Object}   params
 * @param {string}   params.undertone      Required: 'warm'|'cool'|'neutral'
 * @param {string[]} params.product_types  Optional: ['lipstick','blush']
 * @param {number}   params.top_n          Optional: default 10
 * @param {number}   params.max_price      Optional
 * @param {string[]} params.brands         Optional
 *
 * @returns {{ undertone, product_types, total, products: [...] }}
 */
export async function getMakeup(params) {
  return safeCall(() => api.post('/api/makeup', params))
}

/**
 * POST /api/routine -- full 4-step skincare routine builder
 *
 * @param {Object}   params
 * @param {string}   params.skin_type      Required
 * @param {string[]} params.concerns       Optional
 * @param {number}   params.max_budget     Optional: total spend cap
 *
 * @returns {{ skin_type, concerns, max_budget, total_cost, routine: { cleanser, treatment, moisturiser, eye_care } }}
 */
export async function getRoutine(params) {
  return safeCall(() => api.post('/api/routine', params))
}

/**
 * POST /api/explain -- break down why a specific product was recommended
 *
 * @param {Object}   params
 * @param {string}   params.product_id    Required
 * @param {string}   params.skin_type     Required
 * @param {string[]} params.concerns      Optional
 *
 * @returns {{ product_id, name, brand, total_score, components: { skin_type, concerns, rating }, tags_matched }}
 */
export async function getExplanation(params) {
  return safeCall(() => api.post('/api/explain', params))
}

/**
 * GET /api/brands -- top brands for a skin profile
 *
 * @param {string}   skinType    Required
 * @param {string[]} concerns    Optional
 * @param {number}   topN        Optional: default 10
 *
 * @returns {{ skin_type, concerns, brands: [{ brand, mean_score, n_products }] }}
 */
export async function getTopBrands(skinType, concerns = [], topN = 10) {
  const params = new URLSearchParams()
  params.set('skin_type', skinType)
  if (concerns.length > 0) {
    params.set('concerns', concerns.join(','))
  }
  params.set('top_n', topN.toString())

  return safeCall(() => api.get(`/api/brands?${params.toString()}`))
}

// ============================================================================
// Palette endpoints
// ============================================================================

/**
 * GET /api/palette -- colour palette for one undertone
 *
 * @param {string}  undertone     Required: 'warm'|'cool'|'neutral'
 * @param {boolean} includeMeta   Optional: include description/tips (default true)
 *
 * @returns {{ undertone, title, description, best_metals, palette: { blush, lipstick, eyeshadow, ... } }}
 */
export async function getPalette(undertone, includeMeta = true) {
  const params = new URLSearchParams()
  params.set('undertone', undertone)
  if (!includeMeta) params.set('include_meta', 'false')

  return safeCall(() => api.get(`/api/palette?${params.toString()}`))
}

/**
 * GET /api/palette/all -- all three palettes in one call
 * Use this to preload everything on the results page.
 *
 * @returns {{ undertones: ['warm','cool','neutral'], palettes: { warm: {...}, cool: {...}, neutral: {...} } }}
 */
export async function getAllPalettes() {
  return safeCall(() => api.get('/api/palette/all'))
}

/**
 * GET /api/palette/undertones -- list of undertones with descriptions + identification signs
 * Use this to populate the undertone quiz step.
 *
 * @returns {{ undertones: [{ value, title, description, signs: [...] }] }}
 */
export async function getUndertones() {
  return safeCall(() => api.get('/api/palette/undertones'))
}

/**
 * GET /api/palette/compare -- side-by-side palette comparison for one product type
 *
 * @param {string} productType   Required: 'blush'|'lipstick'|'eyeshadow'|'highlighter'|'foundation'
 *
 * @returns {{ product_type, comparison: { warm: [...], cool: [...], neutral: [...] } }}
 */
export async function comparePalettes(productType) {
  return safeCall(() =>
    api.get(`/api/palette/compare?product_type=${encodeURIComponent(productType)}`)
  )
}

// ============================================================================
// Default export -- all functions as a namespace object
// ============================================================================

const client = {
  // Health & info
  getHealth,
  getPing,
  getApiInfo,
  getStats,

  // Recommendations
  getRecommendations,
  getSkincare,
  getMakeup,
  getRoutine,
  getExplanation,
  getTopBrands,

  // Palette
  getPalette,
  getAllPalettes,
  getUndertones,
  comparePalettes,
}

export default client
