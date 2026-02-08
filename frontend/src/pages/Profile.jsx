import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  User,
  Mail,
  Lock,
  Calendar,
  Ruler,
  Weight,
  Activity,
  Target,
  Heart,
  Save,
  Camera,
  Shield,
  Bell,
  Moon,
  Smartphone,
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHealth } from '../context/HealthContext'
import api from '../services/api'

// Section component
function ProfileSection({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// Input field component
function InputField({ label, icon: Icon, type = 'text', value, onChange, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input w-full ${Icon ? 'pl-12' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...props}
        />
      </div>
    </div>
  )
}

// Toggle component
function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50 cursor-pointer hover:bg-dark-800 transition-all">
      <div>
        <p className="font-medium text-white">{label}</p>
        {description && <p className="text-sm text-dark-400">{description}</p>}
      </div>
      <div className={`relative w-12 h-6 rounded-full transition-all ${checked ? 'bg-primary-500' : 'bg-dark-700'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
      </div>
    </label>
  )
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const { profile, mutateProfile } = useHealth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const containerRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    height: '',
    weight: '',
    dateOfBirth: '',
    gender: '',
    activityLevel: '',
    dietType: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    weeklyReport: true
  })

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      }))
    }
    if (profile) {
      setFormData(prev => ({
        ...prev,
        height: profile.height || '',
        weight: profile.weight || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        activityLevel: profile.activityLevel || '',
        dietType: profile.dietType || ''
      }))
    }
  }, [user, profile])

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.profile-section', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power3.out'
      })
    }, containerRef)

    return () => ctx.revert()
  }, [activeTab])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handleSettingChange = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      await api.put('/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activityLevel: formData.activityLevel,
        dietType: formData.dietType
      })

      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName
      })
      mutateProfile()

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate BMI
  const bmi = formData.height && formData.weight
    ? (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1)
    : null

  return (
    <div ref={containerRef} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-dark-400">Manage your account and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'health', label: 'Health Data', icon: Heart },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'settings', label: 'Settings', icon: Bell }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error" />
            )}
            <p className={message.type === 'success' ? 'text-success' : 'text-error'}>{message.text}</p>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile picture & basic info */}
          <div className="profile-section card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-3xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
                <p className="text-dark-400">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge-primary">{formData.activityLevel?.replace('_', ' ') || 'Not set'}</span>
                  <span className="badge-success">{formData.dietType?.replace('_', ' ') || 'Not set'}</span>
                  {bmi && <span className="badge-warning">BMI: {bmi}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <ProfileSection title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                icon={User}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
              <InputField
                label="Last Name"
                icon={User}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
              <InputField
                label="Email"
                icon={Mail}
                type="email"
                value={formData.email}
                disabled
              />
              <InputField
                label="Date of Birth"
                icon={Calendar}
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </ProfileSection>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Physical stats */}
          <ProfileSection title="Physical Stats" icon={Activity}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Height (cm)"
                icon={Ruler}
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
              <InputField
                label="Weight (kg)"
                icon={Weight}
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">BMI</label>
                <div className="input flex items-center justify-center">
                  <span className={`text-lg font-bold ${
                    bmi < 18.5 ? 'text-warning' :
                    bmi < 25 ? 'text-success' :
                    bmi < 30 ? 'text-warning' : 'text-error'
                  }`}>
                    {bmi || '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-dark-300 mb-3">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {['male', 'female', 'other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange('gender', gender)}
                    className={`p-3 rounded-xl border transition-all ${
                      formData.gender === gender
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity level */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-dark-300 mb-3">Activity Level</label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { id: 'sedentary', label: 'Sedentary' },
                  { id: 'lightly_active', label: 'Light' },
                  { id: 'moderately_active', label: 'Moderate' },
                  { id: 'very_active', label: 'Active' },
                  { id: 'extremely_active', label: 'Extreme' }
                ].map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleInputChange('activityLevel', level.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      formData.activityLevel === level.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </ProfileSection>

          {/* Health goals */}
          <ProfileSection title="Health Goals" icon={Target}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile?.healthGoals?.map((goal, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{goal.name}</p>
                    <p className="text-xs text-dark-400">{goal.progress}% complete</p>
                  </div>
                </div>
              )) || (
                <p className="text-dark-400 col-span-2">No health goals set yet.</p>
              )}
            </div>
          </ProfileSection>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change password */}
          <ProfileSection title="Change Password" icon={Lock}>
            <div className="space-y-4">
              <InputField
                label="Current Password"
                icon={Lock}
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              />
              <InputField
                label="New Password"
                icon={Lock}
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              />
              <InputField
                label="Confirm New Password"
                icon={Lock}
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              />

              <button
                onClick={handleChangePassword}
                disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </ProfileSection>

          {/* Connected accounts */}
          <ProfileSection title="Connected Accounts" icon={Smartphone}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Google</p>
                    <p className="text-sm text-dark-400">Connected</p>
                  </div>
                </div>
                <span className="badge-success">Connected</span>
              </div>
            </div>
          </ProfileSection>

          {/* Danger zone */}
          <div className="profile-section card p-6 border-error/30">
            <h2 className="text-lg font-semibold text-error mb-4">Danger Zone</h2>
            <p className="text-dark-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 rounded-lg border border-error text-error hover:bg-error/10 transition-all">
              Delete Account
            </button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Notifications */}
          <ProfileSection title="Notifications" icon={Bell}>
            <div className="space-y-3">
              <Toggle
                label="Email Notifications"
                description="Receive updates and tips via email"
                checked={settings.emailNotifications}
                onChange={() => handleSettingChange('emailNotifications')}
              />
              <Toggle
                label="Push Notifications"
                description="Get real-time notifications on your device"
                checked={settings.pushNotifications}
                onChange={() => handleSettingChange('pushNotifications')}
              />
              <Toggle
                label="Weekly Health Report"
                description="Receive a weekly summary of your progress"
                checked={settings.weeklyReport}
                onChange={() => handleSettingChange('weeklyReport')}
              />
            </div>
          </ProfileSection>

          {/* Appearance */}
          <ProfileSection title="Appearance" icon={Moon}>
            <div className="space-y-3">
              <Toggle
                label="Dark Mode"
                description="Use dark theme for the app"
                checked={settings.darkMode}
                onChange={() => handleSettingChange('darkMode')}
              />
            </div>
          </ProfileSection>
        </div>
      )}
    </div>
  )
}
