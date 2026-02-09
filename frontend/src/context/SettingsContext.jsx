import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'
import i18n from '../i18n'

const SettingsContext = createContext(null)

// Detect system theme preference
const getSystemDarkMode = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return true // Default to dark if matchMedia not available
}

const defaultSettings = {
  notifications: {
    email: true,
    push: true,
    weeklyReport: true,
    workoutReminders: true
  },
  appearance: {
    darkMode: getSystemDarkMode(),
    language: 'en',
    measurementUnit: 'metric'
  },
  privacy: {
    twoFactorAuth: false,
    dataSharing: false
  }
}

export function SettingsProvider({ children }) {
  const { isAuthenticated, user } = useAuth()

  // Get user-scoped storage key
  const getStorageKey = () => {
    const userId = user?.id
    return userId ? `vitalflow_settings_${userId}` : 'vitalflow_settings_guest'
  }

  const [settings, setSettings] = useState(() => {
    // Load from user-scoped key first, then fall back to unscoped legacy key
    const userId = user?.id
    const scopedKey = userId ? `vitalflow_settings_${userId}` : 'vitalflow_settings_guest'
    const saved = localStorage.getItem(scopedKey) || localStorage.getItem('vitalflow_settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })
  const [loading, setLoading] = useState(false)

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (settings.appearance.darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [settings.appearance.darkMode])

  // Listen for system theme changes (only when user hasn't saved explicit preference)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only auto-switch if there's no saved user preference
      const saved = localStorage.getItem('vitalflow_settings')
      if (!saved) {
        setSettings(prev => ({
          ...prev,
          appearance: { ...prev.appearance, darkMode: e.matches }
        }))
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply language on mount and when it changes
  useEffect(() => {
    i18n.changeLanguage(settings.appearance.language)
  }, [settings.appearance.language])

  // Load settings from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings()
    }
  }, [isAuthenticated])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings')
      if (response.data.success) {
        const apiSettings = response.data.settings
        setSettings(apiSettings)
        localStorage.setItem(getStorageKey(), JSON.stringify(apiSettings))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings) => {
    // Update locally immediately
    setSettings(newSettings)
    localStorage.setItem(getStorageKey(), JSON.stringify(newSettings))

    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        await api.put('/settings', newSettings)
      } catch (err) {
        console.error('Failed to save settings:', err)
      }
    }
  }

  const toggleDarkMode = () => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        darkMode: !settings.appearance.darkMode
      }
    }
    updateSettings(newSettings)
  }

  const setLanguage = (language) => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        language
      }
    }
    updateSettings(newSettings)
  }

  const setMeasurementUnit = (unit) => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        measurementUnit: unit
      }
    }
    updateSettings(newSettings)
  }

  // Unit conversion helpers
  const convertWeight = (kg, toUnit = settings.appearance.measurementUnit) => {
    if (toUnit === 'imperial') {
      return {
        value: (kg * 2.20462).toFixed(1),
        unit: 'lbs'
      }
    }
    return { value: kg.toFixed(1), unit: 'kg' }
  }

  const convertHeight = (cm, toUnit = settings.appearance.measurementUnit) => {
    if (toUnit === 'imperial') {
      const totalInches = cm / 2.54
      const feet = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      return {
        value: `${feet}'${inches}"`,
        unit: 'ft'
      }
    }
    return { value: cm.toFixed(0), unit: 'cm' }
  }

  const convertDistance = (km, toUnit = settings.appearance.measurementUnit) => {
    if (toUnit === 'imperial') {
      return {
        value: (km * 0.621371).toFixed(2),
        unit: 'mi'
      }
    }
    return { value: km.toFixed(2), unit: 'km' }
  }

  const convertTemperature = (celsius, toUnit = settings.appearance.measurementUnit) => {
    if (toUnit === 'imperial') {
      return {
        value: ((celsius * 9/5) + 32).toFixed(1),
        unit: 'F'
      }
    }
    return { value: celsius.toFixed(1), unit: 'C' }
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      toggleDarkMode,
      setLanguage,
      setMeasurementUnit,
      convertWeight,
      convertHeight,
      convertDistance,
      convertTemperature,
      isDarkMode: settings.appearance.darkMode,
      language: settings.appearance.language,
      measurementUnit: settings.appearance.measurementUnit
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
