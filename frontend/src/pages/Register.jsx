import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Activity, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { register, error, isAuthenticated, googleLoginUrl } = useAuth()
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

  // GSAP entrance animations
  useEffect(() => {
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

  // Check password strength
  useEffect(() => {
    const password = formData.password
    let strength = 0

    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    setPasswordStrength(strength)
  }, [formData.password])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return
    }

    setIsLoading(true)
    await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    })
    setIsLoading(false)
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-error'
    if (passwordStrength <= 2) return 'bg-warning'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-success'
  }

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 2) return 'Fair'
    if (passwordStrength <= 3) return 'Good'
    return 'Strong'
  }

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  return (
    <div ref={containerRef} className="min-h-screen-safe bg-dark-950 flex safe-area-inset">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/20 via-dark-900 to-dark-950"></div>

        {/* Animated circles */}
        <div className="absolute top-32 right-20 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse animate-delay-300"></div>

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
            Start Your
            <span className="gradient-text block">Health Journey</span>
          </h1>

          <p className="text-xl text-dark-300 mb-8 max-w-md">
            Join thousands of users who have transformed their health with AI-powered personalized guidance.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              'Free personalized health assessment',
              'AI-generated workout & diet plans',
              'Track progress with smart insights',
              'Chat with your AI health assistant'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span className="text-dark-200">{benefit}</span>
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

          <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-dark-400 mb-8">Start your personalized health journey today</p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <a
            href={googleLoginUrl}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg transition-all duration-300 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </a>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-950 text-dark-500">or continue with email</span>
            </div>
          </div>

          {/* Register form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">First name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input w-full pl-12"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input w-full pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input w-full pl-12 pr-12"
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          level <= passwordStrength ? getStrengthColor() : 'bg-dark-800'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-400">
                    Password strength: <span className={passwordStrength >= 4 ? 'text-success' : 'text-dark-300'}>{getStrengthText()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input w-full pl-12 pr-12 ${
                    formData.confirmPassword && !passwordsMatch ? 'input-error' : ''
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                {passwordsMatch && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-error mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-sm text-dark-400">
              By creating an account, you agree to our{' '}
              <button type="button" className="text-primary-400 hover:text-primary-300">Terms of Service</button>
              {' '}and{' '}
              <button type="button" className="text-primary-400 hover:text-primary-300">Privacy Policy</button>
            </p>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
