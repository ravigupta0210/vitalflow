import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { AuthProvider } from './context/AuthContext'
import { HealthProvider } from './context/HealthContext'
import { SettingsProvider } from './context/SettingsContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Initialize i18n
import './i18n'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Diet from './pages/Diet'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import ExerciseLibrary from './pages/ExerciseLibrary'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'

// Layout
import DashboardLayout from './components/dashboard/Layout'

function App() {
  // Initialize Capacitor features on mount
  useEffect(() => {
    const initCapacitor = async () => {
      if (!Capacitor.isNativePlatform()) return

      try {
        // Configure status bar for dark theme
        await StatusBar.setStyle({ style: Style.Dark })

        // On Android, set background color
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0f172a' })
        }

        // Hide splash screen after app is ready
        await SplashScreen.hide()
      } catch (e) {
        console.log('Capacitor init error:', e)
      }
    }

    initCapacitor()
  }, [])

  // SWR global config - prevents caching issues between users
  const swrGlobalConfig = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 2,
    keepPreviousData: false, // Don't show stale data from other users
    provider: () => new Map(), // Fresh cache on each app mount
  }

  return (
    <ErrorBoundary>
      <SWRConfig value={swrGlobalConfig}>
        <AuthProvider>
          <SettingsProvider>
            <HealthProvider>
              <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding (requires auth but not completed onboarding) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes (require auth + completed onboarding) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
              </Routes>
            </HealthProvider>
          </SettingsProvider>
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  )
}

export default App
