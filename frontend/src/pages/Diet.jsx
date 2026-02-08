import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { mutate } from 'swr'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts'
import {
  Utensils, Plus, Check, Clock, Flame, Sparkles, ChevronDown, ChevronUp,
  Calendar, TrendingUp, Coffee, Sun, Sunset, Moon, Apple, Search, X,
  RefreshCw, Target, Droplets, Leaf, AlertCircle, CheckCircle, Scale, Trophy, Zap
} from 'lucide-react'
import { useHealth } from '../context/HealthContext'
import api from '../services/api'
import { DietSkeleton } from '../components/common/Skeleton'

// Meal type icons
const mealIcons = { breakfast: Coffee, lunch: Sun, snack: Apple, dinner: Sunset }

// Meal card component
function MealCard({ meal, onComplete, isCompleted }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = mealIcons[meal.type] || Utensils

  return (
    <div className={`card p-4 transition-all ${isCompleted ? 'border-success/50 bg-success/5' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-success/20' : 'bg-secondary-500/20'}`}>
          <Icon className={`w-6 h-6 ${isCompleted ? 'text-success' : 'text-secondary-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${isCompleted ? 'text-success' : 'text-white'}`}>{meal.name}</h3>
            <span className="badge-primary capitalize">{meal.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{meal.calories} kcal</span>
            <span>{meal.protein}g protein</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button onClick={onComplete} className="p-2 rounded-lg bg-success/20 hover:bg-success/30 text-success transition-all">
              <Check className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 transition-all">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-dark-800">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-dark-800/50">
              <p className="text-lg font-bold text-primary-400">{meal.calories}</p>
              <p className="text-xs text-dark-400">Calories</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-dark-800/50">
              <p className="text-lg font-bold text-blue-400">{meal.protein}g</p>
              <p className="text-xs text-dark-400">Protein</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-dark-800/50">
              <p className="text-lg font-bold text-yellow-400">{meal.carbs}g</p>
              <p className="text-xs text-dark-400">Carbs</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-dark-800/50">
              <p className="text-lg font-bold text-orange-400">{meal.fats}g</p>
              <p className="text-xs text-dark-400">Fats</p>
            </div>
          </div>
          {meal.ingredients?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-dark-500 mb-2 font-medium uppercase tracking-wide">Ingredients</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meal.ingredients.map((ingredient, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/50">
                    <span className="w-2 h-2 rounded-full bg-secondary-500"></span>
                    <span className="text-dark-300 text-sm">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Recipe section hidden - will add video resources in future */}
          {meal.benefits && (
            <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-success">{meal.benefits}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Macro progress ring
function MacroRing({ label, current, target, color }) {
  const progress = Math.min((current / target) * 100, 100)
  const radius = 35
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  const colorMap = { protein: 'stroke-blue-500', carbs: 'stroke-yellow-500', fats: 'stroke-orange-500', calories: 'stroke-primary-500' }

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle className="stroke-dark-800" strokeWidth="6" fill="transparent" r={radius} cx="40" cy="40" />
          <circle className={`${colorMap[color]} transition-all duration-500`} strokeWidth="6" strokeLinecap="round"
            fill="transparent" r={radius} cx="40" cy="40" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="text-xs text-dark-400 mt-1">{label}</p>
      <p className="text-sm text-white">{current}/{target}g</p>
    </div>
  )
}

// Generate Diet Modal
function GenerateModal({ isOpen, onClose, onGenerate, isGenerating, dietType }) {
  const [preferences, setPreferences] = useState({
    mealsPerDay: 4,
    cuisine: 'indian',
    budget: 'moderate',
    restrictions: []
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary-400" />
            <h2 className="text-lg font-semibold text-white">Generate AI Meal Plan</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800"><X className="w-5 h-5 text-dark-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-2">Meals per Day</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => setPreferences({ ...preferences, mealsPerDay: n })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${preferences.mealsPerDay === n ? 'bg-secondary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                  {n} meals
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-2">Cuisine Preference</label>
            <select value={preferences.cuisine} onChange={(e) => setPreferences({ ...preferences, cuisine: e.target.value })} className="input w-full">
              <option value="indian">Indian</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="asian">Asian</option>
              <option value="mixed">Mixed/International</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-2">Budget</label>
            <div className="flex gap-2">
              {['budget', 'moderate', 'premium'].map(b => (
                <button key={b} onClick={() => setPreferences({ ...preferences, budget: b })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-all ${preferences.budget === b ? 'bg-secondary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/20">
            <p className="text-sm text-dark-300">
              <span className="font-medium text-secondary-400">Your Diet Type:</span> {dietType || 'Balanced'}
              <br /><span className="text-xs text-dark-400">Meals will be generated based on your dietary preferences</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t border-dark-800">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onGenerate(preferences)} disabled={isGenerating}
            className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Plan
          </button>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, unit, color = 'secondary', subtext }) {
  const bgColors = { primary: 'bg-primary-500/20', secondary: 'bg-secondary-500/20', success: 'bg-green-500/20', warning: 'bg-yellow-500/20', purple: 'bg-purple-500/20' }
  const textColors = { primary: 'text-primary-400', secondary: 'text-secondary-400', success: 'text-green-400', warning: 'text-yellow-400', purple: 'text-purple-400' }

  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-lg ${bgColors[color]} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${textColors[color]}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}<span className="text-sm text-dark-400 ml-1">{unit}</span></p>
      <p className="text-sm text-dark-400">{label}</p>
      {subtext && <p className="text-xs text-dark-500 mt-1">{subtext}</p>}
    </div>
  )
}

// Live update toast notification
function LiveUpdateToast({ show, data, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show || !data) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="card p-4 bg-dark-900/95 backdrop-blur-xl border-green-500/50 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">Meal Logged!</h4>
            {data.todaySummary && (
              <p className="text-sm text-dark-400">
                {data.todaySummary.totalCalories || 0} cal • {data.todaySummary.mealsLogged || 0} meals today
              </p>
            )}
            {data.streaks?.diet?.current > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
                <Trophy className="w-3 h-3" />
                <span>{data.streaks.diet.current} day streak!</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-dark-700">
            <X className="w-4 h-4 text-dark-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Day Card for Weekly View
function DayCard({ day, isToday, onClick }) {
  return (
    <div onClick={onClick}
      className={`card p-4 cursor-pointer transition-all hover:border-secondary-500/50 ${isToday ? 'border-secondary-500 bg-secondary-500/10' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isToday ? 'text-secondary-400' : 'text-dark-400'}`}>Day {day.dayNumber}</span>
        {isToday && <span className="badge-primary text-xs" style={{ background: '#F59E0B' }}>Today</span>}
      </div>
      <h3 className="font-semibold text-white mb-1">{day.dayName}</h3>
      <p className="text-sm text-dark-400">{day.totalCalories} kcal</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-dark-500">
        <span>{day.meals?.length || 0} meals</span>
      </div>
    </div>
  )
}

export default function Diet() {
  const { generateDiet, logFood, mutateTodayMeals } = useHealth()
  const [dietData, setDietData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [completedMeals, setCompletedMeals] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [activeTab, setActiveTab] = useState('plan')
  const [showLiveToast, setShowLiveToast] = useState(false)
  const [liveUpdateData, setLiveUpdateData] = useState(null)
  const containerRef = useRef(null)

  // Fetch comprehensive diet data
  const fetchDietData = async () => {
    try {
      const response = await api.get('/diet/comprehensive')
      if (response.data.success) {
        setDietData(response.data.data)
        // Set today's meals as selected by default
        const today = new Date().getDay()
        const adjustedDay = today === 0 ? 7 : today
        if (response.data.data.activePlan?.days) {
          const todayMeals = response.data.data.activePlan.days.find(d => d.dayNumber === adjustedDay)
          setSelectedDay(todayMeals || response.data.data.activePlan.days[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch diet data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDietData()
  }, [])

  // GSAP animations
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.diet-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
      }, containerRef)
      return () => ctx.revert()
    }
  }, [isLoading, activeTab])

  const handleGenerate = async (preferences, forceRegenerate = true) => {
    setIsGenerating(true)
    try {
      // Always force regenerate when user clicks the generate/regenerate button
      const response = await api.post('/diet/generate', {
        ...preferences,
        forceRegenerate: forceRegenerate
      })
      if (response.data.success) {
        await fetchDietData()
        setShowGenerateModal(false)
        setCompletedMeals([])
      }
    } catch (err) {
      console.error('Failed to generate diet:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCompleteMeal = async (mealId) => {
    setCompletedMeals(prev => [...prev, mealId])
    const meal = selectedDay?.meals?.find(m => m.id === mealId)
    if (meal) {
      try {
        // Log food and get updated stats
        const response = await api.post('/diet/log', {
          mealType: meal.type,
          foodName: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          mealId
        })

        // Show live update toast with returned data
        if (response.data.success && response.data.data) {
          setLiveUpdateData(response.data.data)
          setShowLiveToast(true)

          // Update local stats immediately
          if (response.data.data.streaks) {
            setDietData(prev => prev ? {
              ...prev,
              stats: {
                ...prev.stats,
                streak: response.data.data.streaks.diet?.current || prev.stats?.streak || 0,
                longestStreak: response.data.data.streaks.diet?.longest || prev.stats?.longestStreak || 0,
                adherence: response.data.data.todaySummary?.completionPercentage || prev.stats?.adherence || 0
              }
            } : prev)
          }

          // Trigger dashboard data refresh (will update when user navigates there)
          mutate('/dashboard/comprehensive')
          mutate('/dashboard/progress/today')
        }
      } catch (err) {
        console.error('Failed to log food:', err)
      }
    }
  }

  if (isLoading) return <DietSkeleton />

  const { profile, goals, conditions, activePlan, targets, stats, recentLogs, aiTips } = dietData || {}

  // Calculate daily totals from selected day
  const dailyTotals = selectedDay?.meals?.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 }

  const macroData = [
    { name: 'Protein', value: targets?.protein || 150, color: '#3B82F6' },
    { name: 'Carbs', value: targets?.carbs || 200, color: '#EAB308' },
    { name: 'Fats', value: targets?.fats || 65, color: '#F97316' }
  ]

  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 7 : today

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="diet-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Diet Plan</h1>
          <p className="text-dark-400">AI-personalized nutrition for your goals</p>
          {goals?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {goals.map((g, i) => <span key={i} className="badge-primary" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>{g.label}</span>)}
            </div>
          )}
        </div>
        <button onClick={() => setShowGenerateModal(true)} className="btn-primary flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
          <Sparkles className="w-5 h-5" />
          {activePlan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {/* Weekly Stats */}
      <div className="diet-card grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Calendar} label="Days Tracked" value={stats?.daysTracked || 0} unit="" color="secondary" />
        <StatCard icon={Flame} label="Avg Calories" value={stats?.avgCalories || 0} unit="cal" color="warning" />
        <StatCard icon={Scale} label="Avg Protein" value={stats?.avgProtein || 0} unit="g" color="primary" />
        <StatCard icon={Target} label="Adherence" value={stats?.adherence || 0} unit="%" color="success" />
        <StatCard
          icon={Zap}
          label="Diet Streak"
          value={stats?.streak || 0}
          unit="days"
          color="purple"
          subtext={stats?.longestStreak ? `Best: ${stats.longestStreak} days` : null}
        />
      </div>

      {/* AI Tips */}
      {aiTips?.length > 0 && (
        <div className="diet-card card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-secondary-400" />
            <h2 className="font-semibold text-white">AI Nutrition Tips</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiTips.slice(0, 3).map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/20">
                <CheckCircle className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePlan ? (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            {['plan', 'nutrition', 'history'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-secondary-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'plan' && (
            <>
              {/* Weekly Plan Overview */}
              <div className="diet-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{activePlan.title}</h2>
                    <p className="text-sm text-dark-400">{activePlan.dailyCalories} kcal/day • {profile?.dietType || 'Balanced'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {activePlan.days?.map((day, idx) => (
                    <DayCard key={idx} day={day} isToday={day.dayNumber === adjustedToday}
                      onClick={() => setSelectedDay(day)} />
                  ))}
                </div>
              </div>

              {/* Selected Day Meals */}
              {selectedDay && (
                <div className="diet-card card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">{selectedDay.dayName}</h2>
                        {selectedDay.dayNumber === adjustedToday && <span className="badge-primary" style={{ background: '#F59E0B' }}>Today</span>}
                      </div>
                      <p className="text-dark-400">{selectedDay.totalCalories} kcal planned</p>
                    </div>
                    {/* Macros Summary */}
                    <div className="flex justify-around gap-4">
                      <MacroRing label="Protein" current={dailyTotals.protein} target={targets?.protein || 150} color="protein" />
                      <MacroRing label="Carbs" current={dailyTotals.carbs} target={targets?.carbs || 200} color="carbs" />
                      <MacroRing label="Fats" current={dailyTotals.fats} target={targets?.fats || 65} color="fats" />
                    </div>
                  </div>

                  {/* Meals List */}
                  <div className="space-y-4">
                    {selectedDay.meals?.map((meal, index) => (
                      <MealCard key={index} meal={meal}
                        isCompleted={completedMeals.includes(meal.id)}
                        onComplete={() => handleCompleteMeal(meal.id)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'nutrition' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Macro Distribution Chart */}
              <div className="diet-card card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Daily Macro Targets</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}g`}>
                        {macroData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Nutrient Breakdown */}
              <div className="diet-card card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Nutrient Targets</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-300">Calories</span>
                      <span className="text-sm text-dark-400">{dailyTotals.calories}/{targets?.calories || 2000} kcal</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((dailyTotals.calories / (targets?.calories || 2000)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-300">Protein</span>
                      <span className="text-sm text-dark-400">{dailyTotals.protein}/{targets?.protein || 150}g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.protein / (targets?.protein || 150)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-300">Carbohydrates</span>
                      <span className="text-sm text-dark-400">{dailyTotals.carbs}/{targets?.carbs || 200}g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="bg-yellow-500 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.carbs / (targets?.carbs || 200)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-300">Fats</span>
                      <span className="text-sm text-dark-400">{dailyTotals.fats}/{targets?.fats || 65}g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.fats / (targets?.fats || 65)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diet Type Info */}
              <div className="diet-card card p-6 lg:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-secondary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Your Diet Type: {profile?.dietType || 'Balanced'}</h3>
                    <p className="text-dark-300 text-sm">
                      Your meal plans are optimized for a {profile?.dietType?.toLowerCase() || 'balanced'} diet with appropriate protein sources,
                      complete nutrients, and considerations for your health goals and conditions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions Notice */}
              {conditions?.length > 0 && (
                <div className="diet-card card p-6 lg:col-span-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white mb-2">Your Diet is Optimized For</h3>
                      <p className="text-sm text-dark-400 mb-3">
                        Based on your health conditions, your meal plan avoids problematic foods and includes beneficial nutrients.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {conditions.map((c, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {recentLogs?.length > 0 ? (
                recentLogs.map((log, index) => (
                  <div key={index} className="diet-card card p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-secondary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{log.foodName}</h3>
                        <p className="text-sm text-dark-400 capitalize">
                          {log.mealType} • {new Date(log.loggedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-secondary-400">{log.calories || 0}</p>
                        <p className="text-xs text-dark-400">kcal</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center">
                  <Calendar className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                  <p className="text-dark-400">No food logs yet</p>
                  <p className="text-sm text-dark-500 mt-1">Complete meals to see your history here</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary-500/20 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 text-secondary-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Meal Plan</h2>
          <p className="text-dark-400 mb-6 max-w-md mx-auto">
            Generate an AI-personalized meal plan based on your profile, dietary preferences, and health goals.
          </p>
          <button onClick={() => setShowGenerateModal(true)} className="btn-primary inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            <Sparkles className="w-5 h-5" />
            Generate Your Plan
          </button>
        </div>
      )}

      {/* Generate Modal */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        dietType={profile?.dietType}
      />

      {/* Live Update Toast */}
      <LiveUpdateToast
        show={showLiveToast}
        data={liveUpdateData}
        onClose={() => setShowLiveToast(false)}
      />
    </div>
  )
}
