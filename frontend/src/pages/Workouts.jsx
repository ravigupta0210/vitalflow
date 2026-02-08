import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { mutate } from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import {
  Dumbbell, Play, Pause, RotateCcw, Check, Clock, Flame, ChevronDown, ChevronUp,
  Sparkles, Plus, Calendar, TrendingUp, Target, X, Zap, Trophy, Timer,
  RefreshCw, ChevronRight, AlertCircle, CheckCircle, Activity, Loader2, Video, Award
} from 'lucide-react'
import { useHealth } from '../context/HealthContext'
import api from '../services/api'
import { WorkoutsSkeleton } from '../components/common/Skeleton'
import { findExerciseGif } from '../services/exerciseDB'

// Exercise card component with GIF support
function ExerciseCard({ exercise, index, isActive, isCompleted, onComplete, onStart }) {
  const [expanded, setExpanded] = useState(false)
  const [gifData, setGifData] = useState(null)
  const [loadingGif, setLoadingGif] = useState(false)
  const [showGif, setShowGif] = useState(false)

  // Load GIF when expanded
  useEffect(() => {
    if (expanded && !gifData && !loadingGif) {
      setLoadingGif(true)
      findExerciseGif(exercise.name).then(data => {
        setGifData(data)
        setLoadingGif(false)
      }).catch(() => setLoadingGif(false))
    }
  }, [expanded, exercise.name, gifData, loadingGif])

  return (
    <div className={`card p-4 transition-all ${isActive ? 'border-primary-500 bg-primary-500/10' : isCompleted ? 'border-success/50 bg-success/5' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${isCompleted ? 'bg-success text-white' : isActive ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400'}`}>
          {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${isCompleted ? 'text-success' : 'text-white'}`}>{exercise.name}</h3>
          <p className="text-sm text-dark-400">{exercise.sets} sets × {exercise.reps} reps{exercise.weight && ` • ${exercise.weight}kg`}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button onClick={() => isActive ? onComplete() : onStart()}
              className={`p-2 rounded-lg transition-all ${isActive ? 'bg-success hover:bg-success/80 text-white' : 'bg-dark-800 hover:bg-dark-700 text-dark-300'}`}>
              {isActive ? <Check className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 transition-all">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-dark-800">
          {/* Exercise GIF/Video Section */}
          <div className="mb-4">
            {loadingGif ? (
              <div className="h-48 rounded-xl bg-dark-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : gifData?.gifUrl ? (
              <div className="relative">
                <div className={`rounded-xl overflow-hidden bg-dark-800 ${showGif ? 'block' : 'hidden'}`}>
                  <img
                    src={gifData.gifUrl}
                    alt={exercise.name}
                    className="w-full h-48 object-contain"
                    onLoad={() => setShowGif(true)}
                  />
                </div>
                {!showGif && (
                  <div
                    className="h-48 rounded-xl bg-dark-800 flex flex-col items-center justify-center cursor-pointer hover:bg-dark-700 transition-all"
                    onClick={() => setShowGif(true)}
                  >
                    <Video className="w-10 h-10 text-primary-500 mb-2" />
                    <p className="text-sm text-dark-400">Click to load demo</p>
                  </div>
                )}
                {gifData.target && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-dark-900/80 text-xs text-primary-400 capitalize">
                    Target: {gifData.target}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 rounded-xl bg-dark-800/50 flex items-center justify-center">
                <div className="text-center">
                  <Dumbbell className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                  <p className="text-xs text-dark-500">No demo available</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-dark-500 mb-1">Target Muscles</p>
              <div className="flex flex-wrap gap-1">
                {(exercise.muscles || [gifData?.target]).filter(Boolean).map((muscle, i) => (
                  <span key={i} className="badge-primary capitalize">{muscle}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">Rest Time</p>
              <p className="text-dark-300">{exercise.rest || 60} seconds</p>
            </div>
          </div>

          {/* Instructions from ExerciseDB */}
          {gifData?.instructions?.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs text-dark-500 mb-2">How to perform</p>
              <ol className="space-y-2">
                {gifData.instructions.slice(0, 4).map((instruction, i) => (
                  <li key={i} className="flex gap-2 text-sm text-dark-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          ) : exercise.instructions && (
            <div>
              <p className="text-xs text-dark-500 mb-1">Instructions</p>
              <p className="text-sm text-dark-300">{exercise.instructions}</p>
            </div>
          )}

          {exercise.tips && (
            <div className="mt-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <p className="text-sm text-primary-300">{exercise.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Rest timer component
function RestTimer({ duration, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { onComplete(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaused, timeLeft, onComplete])

  const progress = ((duration - timeLeft) / duration) * 100

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 card p-4 bg-dark-900/95 backdrop-blur-xl border-primary-500/50 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">Rest Timer</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 transition-all">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button onClick={() => setTimeLeft(duration)} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        </div>
        <span className="text-2xl font-bold text-primary-400 w-16 text-right">{timeLeft}s</span>
      </div>
    </div>
  )
}

// Generate Workout Modal
function GenerateModal({ isOpen, onClose, onGenerate, isGenerating, goals }) {
  const [preferences, setPreferences] = useState({
    daysPerWeek: 5,
    duration: 45,
    equipment: 'gym',
    focus: goals?.[0]?.type || ''
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Generate AI Workout Plan</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800"><X className="w-5 h-5 text-dark-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-2">Days per Week</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map(d => (
                <button key={d} onClick={() => setPreferences({ ...preferences, daysPerWeek: d })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${preferences.daysPerWeek === d ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-2">Session Duration</label>
            <div className="flex gap-2">
              {[30, 45, 60, 90].map(d => (
                <button key={d} onClick={() => setPreferences({ ...preferences, duration: d })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${preferences.duration === d ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-2">Equipment Access</label>
            <select value={preferences.equipment} onChange={(e) => setPreferences({ ...preferences, equipment: e.target.value })} className="input w-full">
              <option value="gym">Full Gym</option>
              <option value="home">Home Equipment</option>
              <option value="minimal">Minimal/Bodyweight</option>
            </select>
          </div>
          {goals?.length > 0 && (
            <div>
              <label className="block text-sm text-dark-400 mb-2">Primary Focus</label>
              <select value={preferences.focus} onChange={(e) => setPreferences({ ...preferences, focus: e.target.value })} className="input w-full">
                {goals.map((g, i) => <option key={i} value={g.type}>{g.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-4 border-t border-dark-800">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onGenerate(preferences)} disabled={isGenerating}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Plan
          </button>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, unit, color = 'primary', subtext }) {
  const bgColors = { primary: 'bg-primary-500/20', success: 'bg-green-500/20', warning: 'bg-yellow-500/20', purple: 'bg-purple-500/20' }
  const textColors = { primary: 'text-primary-400', success: 'text-green-400', warning: 'text-yellow-400', purple: 'text-purple-400' }

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
            <h4 className="font-medium text-white mb-1">Workout Logged!</h4>
            {data.todaySummary && (
              <p className="text-sm text-dark-400">
                {data.todaySummary.exercisesCompleted || 0} exercises • {data.todaySummary.totalDuration || 0} mins
              </p>
            )}
            {data.streaks?.workout?.current > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
                <Trophy className="w-3 h-3" />
                <span>{data.streaks.workout.current} day streak!</span>
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
      className={`card p-4 cursor-pointer transition-all hover:border-primary-500/50 ${isToday ? 'border-primary-500 bg-primary-500/10' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isToday ? 'text-primary-400' : 'text-dark-400'}`}>Day {day.dayNumber}</span>
        {isToday && <span className="badge-primary text-xs">Today</span>}
      </div>
      <h3 className="font-semibold text-white mb-1">{day.dayName}</h3>
      <p className="text-sm text-dark-400">{day.focusArea}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-dark-500">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{day.duration} min</span>
        <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{day.exercises?.length || 0} exercises</span>
      </div>
    </div>
  )
}

export default function Workouts() {
  const { generateWorkout, logWorkout, mutateTodayWorkout } = useHealth()
  const [workoutData, setWorkoutData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [activeExercise, setActiveExercise] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [activeTab, setActiveTab] = useState('plan')
  const [showLiveToast, setShowLiveToast] = useState(false)
  const [liveUpdateData, setLiveUpdateData] = useState(null)
  const containerRef = useRef(null)

  // Fetch comprehensive workout data
  const fetchWorkoutData = async () => {
    try {
      const response = await api.get('/workouts/comprehensive')
      if (response.data.success) {
        setWorkoutData(response.data.data)
        // Set today's workout as selected by default
        const today = new Date().getDay()
        const adjustedDay = today === 0 ? 7 : today
        if (response.data.data.activePlan?.days) {
          const todayWorkout = response.data.data.activePlan.days.find(d => d.dayNumber === adjustedDay)
          setSelectedDay(todayWorkout || response.data.data.activePlan.days[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch workout data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkoutData()
  }, [])

  // GSAP animations
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.workout-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
      }, containerRef)
      return () => ctx.revert()
    }
  }, [isLoading, activeTab])

  const handleGenerate = async (preferences, forceRegenerate = true) => {
    setIsGenerating(true)
    try {
      // Always force regenerate when user clicks the generate/regenerate button
      const response = await api.post('/workouts/generate', {
        ...preferences,
        forceRegenerate: forceRegenerate
      })
      if (response.data.success) {
        await fetchWorkoutData()
        setShowGenerateModal(false)
        setCompletedExercises([])
        setActiveExercise(null)
      }
    } catch (err) {
      console.error('Failed to generate workout:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartExercise = (index) => {
    setActiveExercise(index)
    setShowRestTimer(false)
  }

  const handleCompleteExercise = async (index) => {
    setCompletedExercises(prev => [...prev, index])
    setShowRestTimer(true)

    try {
      // Log workout and get updated stats
      const response = await api.post('/workouts/log', {
        workoutDayId: selectedDay?.id,
        exercises: [{
          exerciseId: selectedDay?.exercises[index]?.id,
          setsCompleted: selectedDay?.exercises[index]?.sets || 3,
          repsCompleted: selectedDay?.exercises[index]?.reps || '10',
          completed: true
        }],
        duration: selectedDay?.duration || 45
      })

      // Show live update toast with returned data
      if (response.data.success && response.data.data) {
        setLiveUpdateData(response.data.data)
        setShowLiveToast(true)

        // Update local stats immediately
        if (response.data.data.streaks) {
          setWorkoutData(prev => prev ? {
            ...prev,
            stats: {
              ...prev.stats,
              streak: response.data.data.streaks.workout?.current || prev.stats?.streak || 0,
              longestStreak: response.data.data.streaks.workout?.longest || prev.stats?.longestStreak || 0,
              consistencyScore: response.data.data.streaks.overall?.consistencyScore || prev.stats?.consistencyScore || 0
            }
          } : prev)
        }

        // Trigger dashboard data refresh (will update when user navigates there)
        mutate('/dashboard/comprehensive')
        mutate('/dashboard/progress/today')
      }
    } catch (err) {
      console.error('Failed to log workout:', err)
    }
  }

  const handleRestComplete = () => {
    setShowRestTimer(false)
    if (activeExercise !== null && selectedDay?.exercises && activeExercise < selectedDay.exercises.length - 1) {
      setActiveExercise(activeExercise + 1)
    } else {
      setActiveExercise(null)
    }
  }

  if (isLoading) return <WorkoutsSkeleton />

  const { profile, goals, conditions, activePlan, stats, muscleProgress, recentWorkouts, aiTips } = workoutData || {}

  const workoutProgress = selectedDay?.exercises
    ? Math.round((completedExercises.length / selectedDay.exercises.length) * 100)
    : 0

  const muscleChartData = muscleProgress ? Object.entries(muscleProgress).map(([muscle, value]) => ({
    muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1),
    value
  })) : []

  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 7 : today

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="workout-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Workouts</h1>
          <p className="text-dark-400">AI-personalized training for your goals</p>
          {goals?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {goals.map((g, i) => <span key={i} className="badge-primary">{g.label}</span>)}
            </div>
          )}
        </div>
        <button onClick={() => setShowGenerateModal(true)} className="btn-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {activePlan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {/* Weekly Stats */}
      <div className="workout-card grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Weekly Workouts" value={stats?.weeklyWorkouts || 0} unit="" color="primary" />
        <StatCard icon={Timer} label="Total Time" value={stats?.totalMinutes || 0} unit="min" color="success" />
        <StatCard icon={Flame} label="Calories Burned" value={stats?.caloriesBurned || 0} unit="cal" color="warning" />
        <StatCard
          icon={Zap}
          label="Current Streak"
          value={stats?.streak || 0}
          unit="days"
          color="purple"
          subtext={stats?.longestStreak ? `Best: ${stats.longestStreak} days` : null}
        />
      </div>

      {/* AI Tips */}
      {aiTips?.length > 0 && (
        <div className="workout-card card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-white">AI Workout Tips</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiTips.slice(0, 3).map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
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
            {['plan', 'progress', 'history'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'plan' && (
            <>
              {/* Weekly Plan Overview */}
              <div className="workout-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{activePlan.title}</h2>
                    <p className="text-sm text-dark-400">{activePlan.durationWeeks} weeks • {activePlan.difficulty}</p>
                  </div>
                  {activePlan.description && (
                    <p className="text-sm text-dark-400 max-w-md hidden lg:block">{activePlan.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {activePlan.days?.map((day, idx) => (
                    <DayCard key={idx} day={day} isToday={day.dayNumber === adjustedToday}
                      onClick={() => setSelectedDay(day)} />
                  ))}
                </div>
              </div>

              {/* Selected Day Workout */}
              {selectedDay && (
                <div className="workout-card card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">{selectedDay.dayName}</h2>
                        {selectedDay.dayNumber === adjustedToday && <span className="badge-primary">Today</span>}
                      </div>
                      <p className="text-dark-400">{selectedDay.focusArea}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedDay.duration} min</span>
                        <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" />{selectedDay.exercises?.length || 0} exercises</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-dark-400">Progress</p>
                        <p className="text-2xl font-bold text-primary-400">{workoutProgress}%</p>
                      </div>
                      <div className="w-16 h-16 relative">
                        <svg className="transform -rotate-90 w-16 h-16">
                          <circle className="stroke-dark-800" strokeWidth="4" fill="transparent" r="28" cx="32" cy="32" />
                          <circle className="stroke-primary-500 transition-all duration-500" strokeWidth="4" strokeLinecap="round" fill="transparent" r="28" cx="32" cy="32"
                            style={{ strokeDasharray: 175.9, strokeDashoffset: 175.9 - (workoutProgress / 100) * 175.9 }} />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-3">
                    {selectedDay.exercises?.map((exercise, index) => (
                      <ExerciseCard key={index} exercise={exercise} index={index}
                        isActive={activeExercise === index}
                        isCompleted={completedExercises.includes(index)}
                        onStart={() => handleStartExercise(index)}
                        onComplete={() => handleCompleteExercise(index)} />
                    ))}
                  </div>

                  {showRestTimer && selectedDay.exercises?.[activeExercise] && (
                    <RestTimer duration={selectedDay.exercises[activeExercise].rest || 60} onComplete={handleRestComplete} />
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'progress' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Muscle Group Progress */}
              <div className="workout-card card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Muscle Group Focus</h3>
                {muscleChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={muscleChartData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="muscle" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={[0, 100]} />
                        <Radar name="Progress %" dataKey="value" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-dark-400">No data available</div>
                )}
              </div>

              {/* Weekly Progress Bar Chart */}
              <div className="workout-card card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Muscle Group Progress</h3>
                <div className="space-y-4">
                  {muscleChartData.map((m, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-dark-300">{m.muscle}</span>
                        <span className="text-sm text-dark-400">{m.value}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${m.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions Notice */}
              {conditions?.length > 0 && (
                <div className="workout-card card p-6 lg:col-span-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white mb-2">Your Workout is Optimized For</h3>
                      <p className="text-sm text-dark-400 mb-3">
                        Based on your health conditions, your workout has been tailored to ensure safety and effectiveness.
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
              {recentWorkouts?.length > 0 ? (
                recentWorkouts.map((workout, index) => (
                  <div key={index} className="workout-card card p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{workout.dayName}</h3>
                        <p className="text-sm text-dark-400">
                          {new Date(workout.completedAt).toLocaleDateString()} • {workout.focusArea}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-400">{workout.duration || 45} min</p>
                        <p className="text-xs text-dark-400">completed</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center">
                  <Calendar className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                  <p className="text-dark-400">No workout history yet</p>
                  <p className="text-sm text-dark-500 mt-1">Complete workouts to see your progress here</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-10 h-10 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Workout Plan</h2>
          <p className="text-dark-400 mb-6 max-w-md mx-auto">
            Generate an AI-personalized workout plan based on your profile, goals, and health conditions.
          </p>
          <button onClick={() => setShowGenerateModal(true)} className="btn-primary inline-flex items-center gap-2">
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
        goals={goals}
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
