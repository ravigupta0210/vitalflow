import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-dark-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-dark-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth()
  const location = useLocation()

  // Show loading while checking auth status
  if (loading) {
    return <LoadingSpinner />
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but onboarding required and not completed
  if (requireOnboarding && !isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  // Authenticated, on onboarding page, but already onboarded - go to dashboard
  if (!requireOnboarding && isOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
