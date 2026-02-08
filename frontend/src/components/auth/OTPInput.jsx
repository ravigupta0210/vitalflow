import { useRef, useState, useEffect } from 'react'

export default function OTPInput({ length = 6, value = '', onChange, disabled = false }) {
  const [otp, setOtp] = useState(Array(length).fill(''))
  const inputRefs = useRef([])

  // Sync external value
  useEffect(() => {
    if (value) {
      const valueArray = value.split('').slice(0, length)
      const newOtp = Array(length).fill('')
      valueArray.forEach((char, index) => {
        newOtp[index] = char
      })
      setOtp(newOtp)
    }
  }, [value, length])

  const handleChange = (index, val) => {
    if (disabled) return

    // Only allow digits
    const digit = val.replace(/\D/g, '').slice(-1)

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    onChange(newOtp.join(''))

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus()
      }
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      onChange(newOtp.join(''))
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    if (disabled) return

    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)

    if (pasteData) {
      const newOtp = Array(length).fill('')
      pasteData.split('').forEach((char, index) => {
        newOtp[index] = char
      })
      setOtp(newOtp)
      onChange(newOtp.join(''))

      // Focus last filled input or next empty
      const focusIndex = Math.min(pasteData.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
            ${digit ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'}
            text-white outline-none`}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
