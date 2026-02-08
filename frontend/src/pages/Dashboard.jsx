import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend
} from 'recharts'
import {
  Activity, TrendingUp, Flame, Droplets, Moon, Dumbbell, Utensils, Target,
  ChevronRight, Plus, Sparkles, Heart, Footprints, User, Scale, Zap, Brain,
  AlertCircle, CheckCircle, Edit3, X, Save, RefreshCw, Clock, Ruler, Apple,
  Award, Calendar, Trophy
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHealth } from '../context/HealthContext'
import { useSettings } from '../context/SettingsContext'
import { DashboardSkeleton } from '../components/common/Skeleton'
import api from '../services/api'

// SWR fetcher with caching
const fetcher = (url) => api.get(url).then(res => res.data.data)

// Color constants
const COLORS = ['#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const BMI_COLORS = { green: '#22C55E', yellow: '#EAB308', orange: '#F97316', red: '#EF4444', gray: '#6B7280' }

// Circular progress component
function CircularProgress({ value, max, size = 120, strokeWidth = 8, color = 'primary', label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle className="stroke-dark-800" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle className="stroke-primary-500 transition-all duration-500" strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold text-white">{Math.round(value)}</span>
          {label ? <span className="text-xs text-dark-400 block">{label}</span> : <span className="text-xs text-dark-400 block">/{max}</span>}
        </div>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({ icon: Icon, label, value, unit, subtext, color = 'primary', trend }) {
  const bgColors = { primary: 'bg-primary-500/20', success: 'bg-green-500/20', warning: 'bg-yellow-500/20', error: 'bg-red-500/20', purple: 'bg-purple-500/20' }
  const textColors = { primary: 'text-primary-400', success: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400', purple: 'text-purple-400' }

  return (
    <div className="card p-2.5 sm:p-3 lg:p-4">
      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${bgColors[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${textColors[color]}`} />
        </div>
        {trend && <span className={`text-[10px] sm:text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{value}<span className="text-xs sm:text-sm text-dark-400 ml-1">{unit}</span></p>
      <p className="text-xs sm:text-sm text-dark-400 truncate">{label}</p>
      {subtext && <p className="text-[10px] sm:text-xs text-dark-500 mt-0.5 sm:mt-1 truncate">{subtext}</p>}
    </div>
  )
}

// Profile Edit Modal
function ProfileEditModal({ isOpen, onClose, profile, onSave }) {
  const [formData, setFormData] = useState({
    weight: profile?.weight || '',
    height: profile?.height || '',
    activityLevel: profile?.activityLevel || 'moderate',
    sleepHours: profile?.sleepHours || 7,
    waterIntake: profile?.waterIntake || 8,
    stressLevel: profile?.stressLevel || 'moderate'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight || '',
        height: profile.height || '',
        activityLevel: profile.activityLevel || 'moderate',
        sleepHours: profile.sleepHours || 7,
        waterIntake: profile.waterIntake || 8,
        stressLevel: profile.stressLevel || 'moderate'
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800"><X className="w-5 h-5 text-dark-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Weight (kg)</label>
              <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="input w-full" placeholder="70" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Height (cm)</label>
              <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="input w-full" placeholder="175" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Activity Level</label>
            <select value={formData.activityLevel} onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
              className="input w-full">
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Very Active</option>
              <option value="very_active">Extremely Active</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Sleep Hours</label>
              <input type="number" value={formData.sleepHours} onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
                className="input w-full" min="4" max="12" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Water (glasses/day)</label>
              <input type="number" value={formData.waterIntake} onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value })}
                className="input w-full" min="1" max="20" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Stress Level</label>
            <select value={formData.stressLevel} onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
              className="input w-full">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t border-dark-800">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// AI Insight Card
function InsightCard({ insight }) {
  const icons = { health: Heart, nutrition: Apple, fitness: Dumbbell, lifestyle: Moon, warning: AlertCircle }
  const colors = { high: 'border-red-500/50 bg-red-500/10', normal: 'border-primary-500/50 bg-primary-500/10', low: 'border-dark-700 bg-dark-800/50' }
  const Icon = icons[insight.type] || Sparkles

  return (
    <div className={`p-4 rounded-xl border ${colors[insight.priority] || colors.normal}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white mb-1">{insight.title}</h4>
          <p className="text-sm text-dark-400">{insight.content}</p>
          {insight.actionable && <p className="text-xs text-primary-400 mt-2">{insight.actionable}</p>}
        </div>
      </div>
    </div>
  )
}

// Streak Display Component
function StreakCard({ type, current, longest, icon: Icon, color = 'primary' }) {
  const bgColors = { primary: 'bg-primary-500/20', success: 'bg-green-500/20', warning: 'bg-yellow-500/20' }
  const textColors = { primary: 'text-primary-400', success: 'text-green-400', warning: 'text-yellow-400' }

  return (
    <div className="card p-2.5 sm:p-3 lg:p-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${bgColors[color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${textColors[color]}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-dark-400 uppercase tracking-wider truncate">{type} Streak</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{current || 0} <span className="text-xs sm:text-sm font-normal text-dark-400">days</span></p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-dark-800">
        <span className="text-[10px] sm:text-xs text-dark-500">Best: {longest || 0} days</span>
        {current > 0 && <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />}
      </div>
    </div>
  )
}

// Live Progress Bar Component
function LiveProgressBar({ label, current, target, unit = '', color = 'primary' }) {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-dark-400">{label}</span>
        <span className="text-white font-medium">{current}{unit} / {target}{unit}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { convertWeight, convertHeight, isDarkMode, measurementUnit } = useSettings()
  const containerRef = useRef(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isTabActive, setIsTabActive] = useState(true)

  // Use SWR for caching and fast responses
  const { data: dashboardData, mutate, isLoading } = useSWR(
    '/dashboard/comprehensive',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache for 30 seconds
      keepPreviousData: true, // Show stale data while revalidating
      errorRetryCount: 2,
    }
  )

  // Live progress polling - fetch today's progress every 10 seconds when tab is active
  const { data: liveProgress } = useSWR(
    isTabActive ? '/dashboard/progress/today' : null,
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  // Track tab visibility for polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // GSAP animations
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.dashboard-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
      }, containerRef)
      return () => ctx.revert()
    }
  }, [isLoading])

  const handleProfileSave = useCallback(async (formData) => {
    setRefreshing(true)
    try {
      await api.put('/dashboard/profile', formData)
      // Revalidate the cache
      await mutate()
    } finally {
      setRefreshing(false)
    }
  }, [mutate])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) return <DashboardSkeleton />

  const { profile, metrics, goals, conditions, charts, aiInsights, healthScore, activePlans } = dashboardData || {}

  // Prepare chart data
  const macroData = charts?.macroDistribution ? [
    { name: 'Protein', value: charts.macroDistribution.protein, color: '#14B8A6' },
    { name: 'Carbs', value: charts.macroDistribution.carbs, color: '#F59E0B' },
    { name: 'Fats', value: charts.macroDistribution.fats, color: '#EF4444' }
  ] : []

  const activityData = charts?.activityBreakdown ? [
    { subject: 'Exercise', value: charts.activityBreakdown.exercise },
    { subject: 'Walking', value: charts.activityBreakdown.walking },
    { subject: 'Standing', value: charts.activityBreakdown.standing },
    { subject: 'Sitting', value: charts.activityBreakdown.sitting }
  ] : []

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header with Health Score */}
      <div className="dashboard-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('dashboard.welcome')}, {dashboardData?.user?.name || user?.firstName || 'there'}!
          </h1>
          <p className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>Here's your personalized health dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowEditModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDarkMode ? 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
          }`}>
            <Edit3 className="w-4 h-4" /> {t('edit')}
          </button>
          <CircularProgress value={healthScore || 75} max={100} label={t('dashboard.health_score')} />
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights?.insights?.length > 0 && (
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">AI Health Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.insights.slice(0, 4).map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
          {aiInsights.motivationalMessage && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/30">
              <p className="text-dark-300 italic">"{aiInsights.motivationalMessage}"</p>
            </div>
          )}
        </div>
      )}

      {/* Live Progress & Streaks */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Today's Progress</h2>
          </div>
          {liveProgress && (
            <span className="text-xs text-dark-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live
            </span>
          )}
        </div>

        {/* Streaks Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <StreakCard
            type="Workout"
            current={liveProgress?.streaks?.workout?.current || 0}
            longest={liveProgress?.streaks?.workout?.longest || 0}
            icon={Dumbbell}
            color="primary"
          />
          <StreakCard
            type="Diet"
            current={liveProgress?.streaks?.diet?.current || 0}
            longest={liveProgress?.streaks?.diet?.longest || 0}
            icon={Utensils}
            color="success"
          />
          <StreakCard
            type="Overall"
            current={liveProgress?.streaks?.overall?.current || 0}
            longest={liveProgress?.streaks?.overall?.consistencyScore || 0}
            icon={Award}
            color="warning"
          />
        </div>

        {/* Today's Activity Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Workout Progress */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-primary-400" />
              <span className="font-medium text-white">Workout Progress</span>
            </div>
            {liveProgress?.workout ? (
              <div className="space-y-2">
                <LiveProgressBar
                  label="Exercises"
                  current={liveProgress.workout.exercisesCompleted}
                  target={10}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Duration</span>
                  <span className="text-white">{liveProgress.workout.totalDuration || 0} mins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Calories Burned</span>
                  <span className="text-primary-400 font-medium">{liveProgress.workout.caloriesBurned || 0} cal</span>
                </div>
              </div>
            ) : (
              <p className="text-dark-400 text-sm">No workouts logged today</p>
            )}
          </div>

          {/* Nutrition Progress */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-4 h-4 text-green-400" />
              <span className="font-medium text-white">Nutrition Progress</span>
            </div>
            {liveProgress?.nutrition ? (
              <div className="space-y-2">
                <LiveProgressBar
                  label="Calories"
                  current={liveProgress.nutrition.totalCalories}
                  target={liveProgress.nutrition.targetCalories || 2000}
                  unit=" cal"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Protein</span>
                  <span className="text-white">{liveProgress.nutrition.totalProtein || 0}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Meals Logged</span>
                  <span className="text-green-400 font-medium">{liveProgress.nutrition.mealsLogged || 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-dark-400 text-sm">No meals logged today</p>
            )}
          </div>
        </div>
      </div>

      {/* Key Health Metrics */}
      <div className="dashboard-card">
        <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.health_score')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          <StatCard icon={Scale} label="BMI" value={metrics?.bmi?.value || '-'} unit=""
            subtext={metrics?.bmi?.category} color={metrics?.bmi?.color === 'green' ? 'success' : metrics?.bmi?.color === 'red' ? 'error' : 'warning'} />
          <StatCard icon={Flame} label="BMR" value={metrics?.bmr || '-'} unit={t('units.kcal')} subtext="Daily base burn" color="warning" />
          <StatCard icon={Zap} label="TDEE" value={metrics?.tdee || '-'} unit={t('units.kcal')} subtext="Total daily energy" color="primary" />
          <StatCard icon={Target} label="Target" value={metrics?.targetCalories || '-'} unit={t('units.kcal')} subtext="Daily goal" color="success" />
          <StatCard icon={Ruler} label={t('profile.height')} value={profile?.height ? convertHeight(profile.height).value : '-'} unit={convertHeight(profile?.height || 0).unit} color="purple" />
          <StatCard icon={Scale} label={t('profile.weight')} value={profile?.weight ? convertWeight(profile.weight).value : '-'} unit={convertWeight(profile?.weight || 0).unit} color="primary" />
        </div>
      </div>

      {/* Profile Overview & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Summary */}
        <div className={`dashboard-card card p-6 ${isDarkMode ? '' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('profile.personal_info')}</h2>
            <button onClick={() => setShowEditModal(true)} className="text-primary-400 hover:text-primary-300">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className={`flex justify-between py-2 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>{t('profile.age')}</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.age || '-'} years</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>{t('profile.gender')}</span>
              <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.gender || '-'}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>{t('profile.diet_type')}</span>
              <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.dietType?.replace('_', ' ') || '-'}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>{t('profile.activity_level')}</span>
              <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.activityLevel?.replace('_', ' ') || '-'}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>Sleep</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.sleepHours || '-'} hours/night</span>
            </div>
            <div className="flex justify-between py-2">
              <span className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>Ideal Weight Range</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {metrics?.idealWeight
                  ? `${convertWeight(metrics.idealWeight.min).value}-${convertWeight(metrics.idealWeight.max).value} ${convertWeight(metrics.idealWeight.min).unit}`
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Health Goals */}
        <div className="dashboard-card card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Health Goals</h2>
            <Link to="/profile" className="text-sm text-primary-400 hover:text-primary-300">Manage</Link>
          </div>
          {goals?.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-dark-800/50 border border-dark-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary-400" />
                      <span className="font-medium text-white">{goal.label}</span>
                    </div>
                    <span className="text-xs text-dark-400">Priority {goal.priority}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${goal.progress || 10}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No goals set yet</p>
            </div>
          )}

          {/* Medical Conditions */}
          {conditions?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-dark-800">
              <h3 className="text-sm font-medium text-dark-400 mb-3">Medical Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm">
                    {condition.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro Distribution Pie Chart */}
        <div className="dashboard-card card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Macro Target</h2>
          {macroData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}g`}>
                    {macroData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-400">No data available</div>
          )}
        </div>

        {/* Activity Breakdown Radar */}
        <div className="dashboard-card card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Activity Breakdown</h2>
          {activityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={activityData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name="Activity %" dataKey="value" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-400">No data available</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/workouts" className="dashboard-card card p-4 flex items-center gap-4 hover:border-primary-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{activePlans?.workout?.title || 'Generate Workout Plan'}</p>
            <p className="text-sm text-dark-400">{activePlans?.workout ? `${activePlans.workout.weeks} weeks • ${activePlans.workout.difficulty}` : 'AI-personalized workouts'}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-dark-500" />
        </Link>

        <Link to="/diet" className="dashboard-card card p-4 flex items-center gap-4 hover:border-secondary-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{activePlans?.diet?.title || 'Generate Diet Plan'}</p>
            <p className="text-sm text-dark-400">{activePlans?.diet ? `${activePlans.diet.dailyCalories} cal/day` : 'AI-personalized meals'}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-dark-500" />
        </Link>
      </div>

      {/* Health Tips */}
      {aiInsights?.healthTips?.length > 0 && (
        <div className="dashboard-card card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Health Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.healthTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/50">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {aiInsights?.recommendations?.length > 0 && (
        <div className="dashboard-card card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Personalized Recommendations</h2>
          <div className="space-y-3">
            {aiInsights.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Sparkles className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <p className="text-dark-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} profile={profile} onSave={handleProfileSave} />
    </div>
  )
}
