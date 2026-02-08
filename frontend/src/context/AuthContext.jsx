import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import api, { clearApiCache, updateCachedToken } from '../services/api'
import { AuthStorage } from '../services/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const isNative = Capacitor.isNativePlatform()

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = await AuthStorage.getAccessToken()
      if (token) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data.data.user)
        } catch (err) {
          console.error('Auth init error:', err)
          await AuthStorage.clearAuth()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  // Handle deep link OAuth callback (for mobile)
  useEffect(() => {
    if (!isNative) return

    const handleAppUrlOpen = async (data) => {
      // Handle OAuth callback deep link
      // Expected format: vitalflow://callback?token=xxx&refresh=xxx&onboarded=true
      if (data.url?.includes('callback')) {
        const url = new URL(data.url)
        const accessToken = url.searchParams.get('token')
        const refreshToken = url.searchParams.get('refresh')
        const isOnboarded = url.searchParams.get('onboarded')

        if (accessToken && refreshToken) {
          await AuthStorage.setTokens(accessToken, refreshToken)

          // Close the browser
          try {
            await Browser.close()
          } catch (e) {
            // Browser might not be open
          }

          // Fetch user data
          const response = await api.get('/auth/me')
          setUser(response.data.data.user)

          if (isOnboarded === 'true') {
            navigate('/dashboard')
          } else {
            navigate('/onboarding')
          }
        }
      }
    }

    App.addListener('appUrlOpen', handleAppUrlOpen)

    return () => {
      App.removeAllListeners()
    }
  }, [isNative, navigate])

  // Login with email/password
  const login = async (email, password) => {
    try {
      setError(null)
      // Clear any previous cached data before login
      clearApiCache()

      const response = await api.post('/auth/login', { email, password })
      const { user: userData, accessToken, refreshToken } = response.data.data

      await AuthStorage.setTokens(accessToken, refreshToken)
      updateCachedToken(accessToken)
      setUser(userData)

      // Redirect based on onboarding status
      if (!userData.isOnboarded) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }

      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, message }
    }
  }

  // Register
  const register = async (data) => {
    try {
      setError(null)
      // Clear any previous cached data before registration
      clearApiCache()

      const response = await api.post('/auth/register', data)
      const { user: userData, accessToken, refreshToken } = response.data.data

      await AuthStorage.setTokens(accessToken, refreshToken)
      updateCachedToken(accessToken)
      setUser(userData)

      navigate('/onboarding')
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, message }
    }
  }

  // Handle OAuth callback (web)
  const handleOAuthCallback = async (accessToken, refreshToken, isOnboarded) => {
    // Clear any previous cached data before OAuth login
    clearApiCache()

    await AuthStorage.setTokens(accessToken, refreshToken)
    updateCachedToken(accessToken)

    // Fetch user data
    const response = await api.get('/auth/me')
    setUser(response.data.data.user)

    if (isOnboarded === 'true') {
      navigate('/dashboard')
    } else {
      navigate('/onboarding')
    }
  }

  // Google login - handles both web and mobile
  const loginWithGoogle = useCallback(async () => {
    const baseUrl = api.defaults.baseURL
    const googleUrl = `${baseUrl}/auth/google`

    if (isNative) {
      // On mobile, use in-app browser with deep link callback
      const redirectUrl = encodeURIComponent('vitalflow://callback')
      await Browser.open({
        url: `${googleUrl}?redirect=${redirectUrl}`,
        windowName: '_blank',
        presentationStyle: 'popover'
      })
    } else {
      // On web, redirect normally
      window.location.href = googleUrl
    }
  }, [isNative])

  // Logout
  const logout = async () => {
    try {
      const refreshToken = await AuthStorage.getRefreshToken()
      await api.post('/auth/logout', { refreshToken })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear all cached data to ensure fresh data for next user
      clearApiCache()
      await AuthStorage.clearAuth()
      setUser(null)
      navigate('/login')
    }
  }

  // Update user data
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  // Google login URL (for backwards compatibility)
  const googleLoginUrl = `${api.defaults.baseURL}/auth/google`

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      updateUser,
      handleOAuthCallback,
      loginWithGoogle,
      googleLoginUrl,
      isAuthenticated: !!user,
      isOnboarded: user?.isOnboarded,
      isNative
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
