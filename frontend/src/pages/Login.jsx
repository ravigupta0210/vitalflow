import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Activity, Smartphone, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import OTPLoginForm from '../components/auth/OTPLoginForm'

export default function Login() {
  const [loginMethod, setLoginMethod] = useState('password') // 'password' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithOTP, error, isAuthenticated, googleLoginUrl } = useAuth()
  const navigate = useNavigate()

  // Refs for GSAP animations
  const containerRef = useRef(null)
  const formRef = useRef(null)
  const heroRef = useRef(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // GSAP entrance animations (respects reduced motion preference)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      gsap.from(heroRef.current?.children || [], {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out'
      })

      gsap.from(formRef.current, {
        opacity: 0,
        x: 30,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out'
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    await login(email, password)
    setIsLoading(false)
  }

  const handleOTPSuccess = (data) => {
    // Use proper auth flow (clears cache, stores tokens, updates state)
    loginWithOTP(data)
  }

  return (
    <div ref={containerRef} className="min-h-screen-safe bg-dark-950 flex safe-area-inset">
      {/* Left side - Hero (always dark) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden auth-hero">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-[#0f172a] to-[#020617]"></div>

        {/* Animated circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse animate-delay-500"></div>

        {/* Content */}
        <div ref={heroRef} className="relative z-10 flex flex-col justify-center px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">VitalFlow</span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Your Personal
            <span className="gradient-text block">AI Health Partner</span>
          </h1>

          <p className="text-xl text-dark-300 mb-8 max-w-md">
            Get personalized workout plans, nutrition guidance, and health insights powered by advanced AI.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              'AI-powered personalized workouts',
              'Smart nutrition planning',
              'Real-time health insights',
              '24/7 AI health assistant'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                </div>
                <span className="text-dark-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div ref={formRef} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VitalFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-dark-400 mb-8">Sign in to continue your health journey</p>

          {/* Error message - only show for password login */}
          {error && loginMethod === 'password' && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <a
            href={googleLoginUrl}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg border border-gray-200 transition-all duration-300 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-950 text-dark-500">or sign in with</span>
            </div>
          </div>

          {/* Login method tabs */}
          <div className="flex bg-dark-800 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'password'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'otp'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              OTP Login
            </button>
          </div>

          {/* Login forms */}
          {loginMethod === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-dark-300">Password</label>
                  <button type="button" className="text-sm text-primary-400 hover:text-primary-300">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pl-12 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <OTPLoginForm onSuccess={handleOTPSuccess} />
          )}

          {/* Register link */}
          <p className="mt-8 text-center text-dark-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
