import { useState } from 'react'
import { Mail, Phone, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import OTPInput from './OTPInput'
import api from '../../services/api'

export default function OTPLoginForm({ onSuccess }) {
  const [step, setStep] = useState('identifier') // 'identifier' | 'otp'
  const [identifierType, setIdentifierType] = useState('email') // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const endpoint = identifierType === 'email'
        ? '/auth/otp/send-email'
        : '/auth/otp/send-sms'

      const payload = identifierType === 'email'
        ? { email: identifier, purpose: 'login' }
        : { phone: identifier, purpose: 'login' }

      const response = await api.post(endpoint, payload)

      if (response.data.success) {
        setStep('otp')
        setExpiresAt(response.data.expiresAt)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await api.post('/auth/otp/verify', {
        identifier,
        otp,
        type: identifierType
      })

      if (response.data.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)

        // Call success callback with user data
        onSuccess(response.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setOtp('')
    setError(null)
    await handleSendOTP({ preventDefault: () => {} })
  }

  const goBack = () => {
    setStep('identifier')
    setOtp('')
    setError(null)
  }

  return (
    <div className="space-y-5">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {step === 'identifier' ? (
        <>
          {/* Identifier type toggle */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIdentifierType('email')
                setIdentifier('')
                setError(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                identifierType === 'email'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifierType('phone')
                setIdentifier('')
                setError(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                identifierType === 'phone'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>

          {/* Identifier input */}
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                {identifierType === 'email' ? (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                ) : (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                )}
                <input
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input w-full pl-12"
                  placeholder={identifierType === 'email' ? 'you@example.com' : '+91 9876543210'}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <>
          {/* OTP verification step */}
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-6">
            <p className="text-dark-300 mb-1">
              We sent a verification code to
            </p>
            <p className="text-white font-medium">{identifier}</p>
          </div>

          <form onSubmit={handleVerifyOTP}>
            <div className="mb-6">
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-dark-400">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-primary-400 hover:text-primary-300 font-medium disabled:opacity-50"
              >
                Resend
              </button>
            </p>
          </form>
        </>
      )}
    </div>
  )
}
