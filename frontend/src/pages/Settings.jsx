import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  Shield,
  Trash2,
  Save,
  Check,
  Loader2,
  Phone,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { settings, updateSettings, isDarkMode, language, measurementUnit } = useSettings()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false)
  const [phoneError, setPhoneError] = useState(null)

  // Local settings state for form
  const [localSettings, setLocalSettings] = useState(settings)

  // Sync local settings with context
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Load phone number from profile
  useEffect(() => {
    loadPhoneNumber()
  }, [])

  const loadPhoneNumber = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        const user = response.data.data.user
        setPhoneNumber(user.mobileNumber || '')
        setPhoneVerified(user.mobileVerified || false)
      }
    } catch (err) {
      console.error('Failed to load phone number:', err)
    }
  }

  const handleToggle = (section, key) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key]
      }
    }))
  }

  const handleSelectChange = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Update context (which syncs to API and localStorage)
      await updateSettings(localSettings)

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(t('error'))
    } finally {
      setSaving(false)
    }
  }

  const handleSendPhoneOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError('Please enter a valid phone number')
      return
    }

    try {
      setSendingOtp(true)
      setPhoneError(null)
      const response = await api.post('/auth/otp/send-phone-verification', { phone: phoneNumber })
      if (response.data.success) {
        setShowPhoneOtpInput(true)
      }
    } catch (err) {
      console.error('Failed to send OTP:', err)
      setPhoneError(err.response?.data?.error || 'Failed to send OTP. SMS service may not be configured.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneError('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setVerifyingPhone(true)
      setPhoneError(null)
      const response = await api.post('/auth/otp/verify-phone', {
        phone: phoneNumber,
        otp: phoneOtp
      })
      if (response.data.success) {
        setPhoneVerified(true)
        setShowPhoneOtpInput(false)
        setPhoneOtp('')
      }
    } catch (err) {
      console.error('Failed to verify phone:', err)
      setPhoneError(err.response?.data?.error || 'Failed to verify phone. Please try again.')
    } finally {
      setVerifyingPhone(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true)
      const response = await api.delete('/auth/delete-account', {
        data: { password: deletePassword }
      })
      if (response.data.success) {
        logout()
        navigate('/login')
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const Toggle = ({ enabled, onToggle, disabled = false }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary-500' : 'bg-dark-700 dark:bg-dark-700 light:bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  )

  const SettingRow = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-center justify-between py-4 border-b border-dark-800 dark:border-dark-800 light:border-gray-200 last:border-0">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-dark-800 dark:bg-dark-800 light:bg-gray-100 rounded-lg">
          <Icon className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-white dark:text-white light:text-gray-900 font-medium">{title}</h3>
          <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{t('settings.title')}</h1>
          <p className="text-dark-400 dark:text-dark-400 light:text-gray-500 mt-1">{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            saved
              ? 'bg-success/20 text-success'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.save_changes')}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error" />
          <span className="text-error">{error}</span>
        </div>
      )}

      {/* Notifications Section */}
      <div className="bg-dark-900/50 dark:bg-dark-900/50 light:bg-white border border-dark-800 dark:border-dark-800 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{t('settings.notifications')}</h2>
        </div>

        <div className="space-y-1">
          <SettingRow
            icon={Bell}
            title={t('settings.email_notifications')}
            description={t('settings.email_notifications_desc')}
          >
            <Toggle
              enabled={localSettings.notifications?.email}
              onToggle={() => handleToggle('notifications', 'email')}
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title={t('settings.push_notifications')}
            description={t('settings.push_notifications_desc')}
          >
            <Toggle
              enabled={localSettings.notifications?.push}
              onToggle={() => handleToggle('notifications', 'push')}
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title={t('settings.weekly_report')}
            description={t('settings.weekly_report_desc')}
          >
            <Toggle
              enabled={localSettings.notifications?.weeklyReport}
              onToggle={() => handleToggle('notifications', 'weeklyReport')}
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title={t('settings.workout_reminders')}
            description={t('settings.workout_reminders_desc')}
          >
            <Toggle
              enabled={localSettings.notifications?.workoutReminders}
              onToggle={() => handleToggle('notifications', 'workoutReminders')}
            />
          </SettingRow>
        </div>
      </div>

      {/* Phone Number Section */}
      <div className="bg-dark-900/50 dark:bg-dark-900/50 light:bg-white border border-dark-800 dark:border-dark-800 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{t('settings.phone_number')}</h2>
          {phoneVerified && (
            <span className="px-2 py-0.5 bg-success/20 text-success text-xs rounded-full">{t('settings.verified')}</span>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-500">
            {t('settings.phone_desc')}
          </p>

          <div className="flex gap-3">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('settings.enter_phone')}
              disabled={phoneVerified}
              className="flex-1 bg-dark-800 dark:bg-dark-800 light:bg-gray-100 border border-dark-700 dark:border-dark-700 light:border-gray-300 rounded-lg px-4 py-2 text-white dark:text-white light:text-gray-900 placeholder-dark-500 focus:outline-none focus:border-primary-500 disabled:opacity-50"
            />
            {!phoneVerified && (
              <button
                onClick={handleSendPhoneOtp}
                disabled={sendingOtp || !phoneNumber}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingOtp && <Loader2 className="w-4 h-4 animate-spin" />}
                {sendingOtp ? '...' : t('settings.verify')}
              </button>
            )}
          </div>

          {showPhoneOtpInput && (
            <div className="flex gap-3">
              <input
                type="text"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('settings.enter_otp')}
                maxLength={6}
                className="flex-1 bg-dark-800 dark:bg-dark-800 light:bg-gray-100 border border-dark-700 dark:border-dark-700 light:border-gray-300 rounded-lg px-4 py-2 text-white dark:text-white light:text-gray-900 placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleVerifyPhone}
                disabled={verifyingPhone || phoneOtp.length !== 6}
                className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {verifyingPhone && <Loader2 className="w-4 h-4 animate-spin" />}
                {verifyingPhone ? '...' : t('confirm')}
              </button>
            </div>
          )}

          {phoneError && (
            <p className="text-sm text-error">{phoneError}</p>
          )}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-dark-900/50 dark:bg-dark-900/50 light:bg-white border border-dark-800 dark:border-dark-800 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Moon className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{t('settings.appearance')}</h2>
        </div>

        <div className="space-y-1">
          <SettingRow
            icon={localSettings.appearance?.darkMode ? Moon : Sun}
            title={t('settings.dark_mode')}
            description={t('settings.dark_mode_desc')}
          >
            <Toggle
              enabled={localSettings.appearance?.darkMode}
              onToggle={() => handleToggle('appearance', 'darkMode')}
            />
          </SettingRow>

          <SettingRow
            icon={Globe}
            title={t('settings.language')}
            description={t('settings.language_desc')}
          >
            <select
              value={localSettings.appearance?.language || 'en'}
              onChange={(e) => handleSelectChange('appearance', 'language', e.target.value)}
              className="bg-dark-800 dark:bg-dark-800 light:bg-gray-100 border border-dark-700 dark:border-dark-700 light:border-gray-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="fr">Français (French)</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Globe}
            title={t('settings.measurement_units')}
            description={t('settings.measurement_units_desc')}
          >
            <select
              value={localSettings.appearance?.measurementUnit || 'metric'}
              onChange={(e) => handleSelectChange('appearance', 'measurementUnit', e.target.value)}
              className="bg-dark-800 dark:bg-dark-800 light:bg-gray-100 border border-dark-700 dark:border-dark-700 light:border-gray-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="metric">{t('settings.metric')}</option>
              <option value="imperial">{t('settings.imperial')}</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* Privacy & Security Section */}
      <div className="bg-dark-900/50 dark:bg-dark-900/50 light:bg-white border border-dark-800 dark:border-dark-800 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{t('settings.privacy_security')}</h2>
        </div>

        <div className="space-y-1">
          <SettingRow
            icon={Lock}
            title={t('settings.two_factor')}
            description={t('settings.two_factor_desc')}
          >
            <Toggle
              enabled={localSettings.privacy?.twoFactorAuth}
              onToggle={() => handleToggle('privacy', 'twoFactorAuth')}
            />
          </SettingRow>

          <SettingRow
            icon={Shield}
            title={t('settings.data_sharing')}
            description={t('settings.data_sharing_desc')}
          >
            <Toggle
              enabled={localSettings.privacy?.dataSharing}
              onToggle={() => handleToggle('privacy', 'dataSharing')}
            />
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-900/50 dark:bg-dark-900/50 light:bg-white border border-error/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-error" />
          <h2 className="text-lg font-semibold text-error">{t('settings.danger_zone')}</h2>
        </div>

        {!deleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white dark:text-white light:text-gray-900 font-medium">{t('settings.delete_account')}</h3>
              <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-500 mt-0.5">
                {t('settings.delete_account_desc')}
              </p>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg font-medium transition-all"
            >
              {t('settings.delete_account')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-dark-300 dark:text-dark-300 light:text-gray-600">
              {t('settings.delete_confirm')}
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('settings.enter_password')}
              className="w-full bg-dark-800 dark:bg-dark-800 light:bg-gray-100 border border-dark-700 dark:border-dark-700 light:border-gray-300 rounded-lg px-4 py-2 text-white dark:text-white light:text-gray-900 placeholder-dark-500 focus:outline-none focus:border-error"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(false)
                  setDeletePassword('')
                }}
                className="flex-1 px-4 py-2 bg-dark-800 dark:bg-dark-800 light:bg-gray-200 hover:bg-dark-700 text-white dark:text-white light:text-gray-900 rounded-lg font-medium transition-all"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1 px-4 py-2 bg-error hover:bg-error/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? t('settings.deleting') : t('settings.confirm_delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
