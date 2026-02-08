import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { handleOAuthCallback } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const isOnboarded = searchParams.get('isOnboarded')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login', { state: { error: 'Authentication failed. Please try again.' } })
      return
    }

    if (accessToken && refreshToken) {
      handleOAuthCallback(accessToken, refreshToken, isOnboarded)
    } else {
      navigate('/login')
    }
  }, [searchParams, handleOAuthCallback, navigate])

  return (
    <div className="min-h-screen-safe bg-dark-950 flex items-center justify-center safe-area-inset">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center animate-pulse">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 blur-xl opacity-50 animate-pulse"></div>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-dark-300">Completing authentication...</p>
        </div>
      </div>
    </div>
  )
}
