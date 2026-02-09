import axios from 'axios'
import { AuthStorage } from './storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})

// ============ REQUEST DEDUPLICATION ============
// Prevents duplicate simultaneous requests to the same endpoint
const pendingRequests = new Map()

const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`
}

// ============ TOKEN REFRESH DEDUPLICATION ============
// Prevents multiple token refresh calls when multiple 401s occur
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const onTokenRefreshFailed = (error) => {
  refreshSubscribers.forEach(callback => callback(null, error))
  refreshSubscribers = []
}

// ============ TOKEN CACHE ============
// Cache token in memory to avoid async storage reads on every request
let cachedAccessToken = null

// Initialize cached token from storage
AuthStorage.getAccessToken().then(token => {
  cachedAccessToken = token
})

// Update cached token when storage changes
export const updateCachedToken = (token) => {
  cachedAccessToken = token
}

// Clear all cached data (call on logout/user switch)
export const clearApiCache = () => {
  cachedAccessToken = null
  pendingRequests.clear()
  isRefreshing = false
  refreshSubscribers = []
}

// Request interceptor - add auth token + deduplication
api.interceptors.request.use(
  async (config) => {
    // Use cached token for sync access, or fetch from storage
    let token = cachedAccessToken
    if (!token) {
      token = await AuthStorage.getAccessToken()
      cachedAccessToken = token
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Request deduplication for GET requests
    if (config.method === 'get' && !config.skipDedup) {
      const requestKey = getRequestKey(config)

      if (pendingRequests.has(requestKey)) {
        // Return existing promise for duplicate request
        const controller = new AbortController()
        config.signal = controller.signal

        pendingRequests.get(requestKey).then(
          () => controller.abort('duplicate'),
          () => controller.abort('duplicate')
        )

        return {
          ...config,
          _dedupedRequest: pendingRequests.get(requestKey)
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh with deduplication
api.interceptors.response.use(
  (response) => {
    // Clean up pending request tracking
    const requestKey = getRequestKey(response.config)
    pendingRequests.delete(requestKey)
    return response
  },
  async (error) => {
    // Handle deduped request
    if (error.config?._dedupedRequest) {
      return error.config._dedupedRequest
    }

    const originalRequest = error.config

    // Clean up pending request on error
    if (originalRequest) {
      const requestKey = getRequestKey(originalRequest)
      pendingRequests.delete(requestKey)
    }

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // If already refreshing, wait for it to complete
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (err) {
              reject(err)
            } else if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            } else {
              reject(new Error('Token refresh failed'))
            }
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = await AuthStorage.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        // Update both storage and cache
        await AuthStorage.setTokens(accessToken, newRefreshToken)
        cachedAccessToken = accessToken

        isRefreshing = false
        onTokenRefreshed(accessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        onTokenRefreshFailed(refreshError)

        // Refresh failed - clear tokens and dispatch event for React to handle
        await AuthStorage.clearAuth()
        cachedAccessToken = null
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ============ PREFETCH HELPER ============
// Prefetch data and store in cache
export const prefetch = (url) => {
  const requestKey = `get:${url}:{}:{}`
  if (!pendingRequests.has(requestKey)) {
    const promise = api.get(url)
    pendingRequests.set(requestKey, promise)
    promise.finally(() => {
      setTimeout(() => pendingRequests.delete(requestKey), 5000)
    })
  }
  return pendingRequests.get(requestKey)
}

export default api
