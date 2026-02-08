import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  User,
  Heart,
  Target,
  CheckCircle,
  Ruler,
  Weight,
  Calendar,
  Moon,
  Briefcase,
  Droplets,
  Coffee,
  Cigarette,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const HEALTH_GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '🏃', description: 'Lose weight healthily' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪', description: 'Build lean muscle' },
  { id: 'improve_fitness', label: 'Improve Fitness', icon: '🏋️', description: 'Get more active' },
  { id: 'better_sleep', label: 'Better Sleep', icon: '😴', description: 'Improve sleep quality' },
  { id: 'stress_management', label: 'Stress Management', icon: '🧘', description: 'Reduce stress levels' },
  { id: 'increase_energy', label: 'Increase Energy', icon: '⚡', description: 'Boost daily energy' },
  { id: 'diabetes_management', label: 'Diabetes Management', icon: '💉', description: 'Manage blood sugar' },
  { id: 'heart_health', label: 'Heart Health', icon: '❤️', description: 'Improve cardiovascular health' },
  { id: 'flexibility', label: 'Flexibility', icon: '🤸', description: 'Improve mobility' },
  { id: 'pcod_management', label: 'PCOD Management', icon: '🌸', description: 'Manage PCOD symptoms' },
  { id: 'thyroid_management', label: 'Thyroid Management', icon: '🦋', description: 'Balance thyroid health' },
  { id: 'general_wellness', label: 'General Wellness', icon: '🌟', description: 'Overall health improvement' }
]

const MEDICAL_CONDITIONS = [
  { id: 'none', label: 'No conditions' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'heart_condition', label: 'Heart Condition' },
  { id: 'thyroid', label: 'Thyroid Disorder' },
  { id: 'pcod', label: 'PCOD/PCOS' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'arthritis', label: 'Arthritis' },
  { id: 'back_pain', label: 'Chronic Back Pain' },
  { id: 'other', label: 'Other' }
]

const DIET_TYPES = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'non_vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' }
]

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { id: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { id: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { id: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { id: 'extremely_active', label: 'Extremely Active', description: 'Very hard exercise + physical job' }
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [error, setError] = useState(null)
  const [questionCategories, setQuestionCategories] = useState([])
  const [questionMeta, setQuestionMeta] = useState({ totalQuestions: 0, estimatedTime: '' })

  const [loaderStage, setLoaderStage] = useState(0)

  const [formData, setFormData] = useState({
    // Step 1: Basic Profile
    gender: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    dietType: '',
    activityLevel: '',

    // Step 2: Lifestyle
    sleepHours: '7',
    workType: 'desk_job',
    stressLevel: 'moderate',
    waterIntake: '6',
    caffeine: false,
    smoking: false,
    alcohol: false,

    // Step 3: Health Goals
    healthGoals: [],
    medicalConditions: [],

    // Step 4: Conditional Questions
    conditionalAnswers: {}
  })

  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const stepRef = useRef(null)

  // Animate step transitions
  useEffect(() => {
    if (stepRef.current) {
      gsap.fromTo(
        stepRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [currentStep])

  // Loader stages for interactive animation
  const loaderStages = [
    { icon: '🔍', text: 'Analyzing your health profile...', subtext: 'Understanding your goals and conditions' },
    { icon: '🧠', text: 'AI is thinking...', subtext: 'Creating personalized assessment' },
    { icon: '📋', text: 'Preparing questions...', subtext: 'Tailoring questions for your needs' },
    { icon: '✨', text: 'Almost there...', subtext: 'Finalizing your personalized questionnaire' }
  ]

  // Animate loader stages
  useEffect(() => {
    if (!isLoadingQuestions) {
      setLoaderStage(0)
      return
    }

    const interval = setInterval(() => {
      setLoaderStage(prev => (prev + 1) % loaderStages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoadingQuestions])

  // Fetch AI-generated personalized questions when entering step 4
  useEffect(() => {
    const fetchAIQuestions = async () => {
      if (formData.healthGoals.length > 0) {
        setIsLoadingQuestions(true)
        setLoaderStage(0)
        try {
          // Backend fetches user data from database (saved in previous steps)
          const response = await api.get('/onboarding/generate-questions')

          if (response.data.data?.categories) {
            setQuestionCategories(response.data.data.categories)
            setQuestionMeta({
              totalQuestions: response.data.data.totalQuestions || 0,
              estimatedTime: response.data.data.estimatedTime || ''
            })
          }
        } catch (err) {
          console.error('Failed to fetch AI questions:', err)
          // Fallback to empty - the step will show a message
          setQuestionCategories([])
        } finally {
          setIsLoadingQuestions(false)
        }
      }
    }

    if (currentStep === 4) {
      fetchAIQuestions()
    }
  }, [currentStep, formData.healthGoals])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGoalToggle = (goalId) => {
    setFormData(prev => {
      const goals = prev.healthGoals.includes(goalId)
        ? prev.healthGoals.filter(g => g !== goalId)
        : prev.healthGoals.length < 3
          ? [...prev.healthGoals, goalId]
          : prev.healthGoals
      return { ...prev, healthGoals: goals }
    })
  }

  const handleConditionToggle = (conditionId) => {
    setFormData(prev => {
      if (conditionId === 'none') {
        return { ...prev, medicalConditions: ['none'] }
      }
      const conditions = prev.medicalConditions.filter(c => c !== 'none')
      const newConditions = conditions.includes(conditionId)
        ? conditions.filter(c => c !== conditionId)
        : [...conditions, conditionId]
      return { ...prev, medicalConditions: newConditions }
    })
  }

  const handleConditionalAnswer = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      conditionalAnswers: { ...prev.conditionalAnswers, [questionId]: value }
    }))
  }

  const submitStep = async (step) => {
    setIsLoading(true)
    setError(null)

    try {
      await api.post(`/onboarding/step/${step}`, getStepData(step))
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save data')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStepData = (step) => {
    switch (step) {
      case 1:
        return {
          gender: formData.gender,
          age: calculateAge(formData.dateOfBirth),
          heightCm: parseFloat(formData.height),
          weightKg: parseFloat(formData.weight),
          dietType: formData.dietType,
          activityLevel: formData.activityLevel
        }
      case 2:
        return {
          sleepHours: parseInt(formData.sleepHours),
          workType: formData.workType,
          stressLevel: formData.stressLevel,
          waterIntake: parseInt(formData.waterIntake),
          smoking: formData.smoking,
          alcohol: formData.alcohol
        }
      case 3:
        return {
          goals: formData.healthGoals,
          medicalConditions: formData.medicalConditions.filter(c => c !== 'none')
        }
      case 4:
        return {
          answers: formData.conditionalAnswers
        }
      default:
        return {}
    }
  }

  const nextStep = async () => {
    const success = await submitStep(currentStep)
    if (success) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1)
      } else {
        await completeOnboarding()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    try {
      await api.post('/onboarding/complete')
      updateUser({ isOnboarded: true })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  // Get all required questions from categories
  const requiredQuestions = useMemo(() => {
    if (!questionCategories.length) return []
    return questionCategories.flatMap(cat =>
      cat.questions.filter(q => q.required).map(q => q.id)
    )
  }, [questionCategories])

  // Check if all required questions are answered
  const areRequiredQuestionsAnswered = useMemo(() => {
    if (requiredQuestions.length === 0) return true
    return requiredQuestions.every(qId => {
      const answer = formData.conditionalAnswers[qId]
      if (Array.isArray(answer)) return answer.length > 0
      return answer !== undefined && answer !== '' && answer !== null
    })
  }, [requiredQuestions, formData.conditionalAnswers])

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.gender && formData.dateOfBirth && formData.height && formData.weight && formData.dietType && formData.activityLevel
      case 2:
        return formData.sleepHours && formData.workType && formData.stressLevel && formData.waterIntake
      case 3:
        return formData.healthGoals.length > 0
      case 4:
        // Disable if still loading or required questions not answered
        if (isLoadingQuestions) return false
        return areRequiredQuestionsAnswered
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div ref={stepRef} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Basic Profile</h2>
              <p className="text-dark-400">Tell us about yourself to personalize your experience</p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {['male', 'female', 'other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange('gender', gender)}
                    className={`p-4 rounded-xl border transition-all ${
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

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="input w-full"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Ruler className="inline w-4 h-4 mr-2" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="input w-full"
                  placeholder="170"
                  min="100"
                  max="250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Weight className="inline w-4 h-4 mr-2" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="input w-full"
                  placeholder="70"
                  min="30"
                  max="300"
                />
              </div>
            </div>

            {/* Diet Type */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Diet Preference</label>
              <div className="grid grid-cols-2 gap-3">
                {DIET_TYPES.map((diet) => (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => handleInputChange('dietType', diet.id)}
                    className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                      formData.dietType === diet.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-2xl">{diet.icon}</span>
                    <span>{diet.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Activity Level</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleInputChange('activityLevel', level.id)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      formData.activityLevel === level.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                    }`}
                  >
                    <p className={formData.activityLevel === level.id ? 'text-primary-400' : 'text-white'}>{level.label}</p>
                    <p className="text-sm text-dark-400">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div ref={stepRef} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-secondary-500/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-secondary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Lifestyle</h2>
              <p className="text-dark-400">Help us understand your daily habits</p>
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <Moon className="inline w-4 h-4 mr-2" />
                Average Sleep Hours
              </label>
              <input
                type="range"
                min="4"
                max="12"
                value={formData.sleepHours}
                onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-sm text-dark-400 mt-1">
                <span>4 hours</span>
                <span className="text-primary-400 font-medium">{formData.sleepHours} hours</span>
                <span>12 hours</span>
              </div>
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                <Briefcase className="inline w-4 h-4 mr-2" />
                Work Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'desk_job', label: 'Desk Job' },
                  { id: 'standing_job', label: 'Standing Job' },
                  { id: 'physical_labor', label: 'Physical Labor' },
                  { id: 'remote', label: 'Remote/WFH' }
                ].map((work) => (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => handleInputChange('workType', work.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      formData.workType === work.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    {work.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Stress Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['low', 'moderate', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleInputChange('stressLevel', level)}
                    className={`p-4 rounded-xl border transition-all ${
                      formData.stressLevel === level
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Water Intake */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <Droplets className="inline w-4 h-4 mr-2" />
                Daily Water Intake (glasses)
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={formData.waterIntake}
                onChange={(e) => handleInputChange('waterIntake', e.target.value)}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-sm text-dark-400 mt-1">
                <span>1 glass</span>
                <span className="text-primary-400 font-medium">{formData.waterIntake} glasses</span>
                <span>15 glasses</span>
              </div>
            </div>

            {/* Habits */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Habits</label>
              <div className="space-y-3">
                {[
                  { id: 'caffeine', label: 'Caffeine Consumer', icon: Coffee },
                  { id: 'smoking', label: 'Smoker', icon: Cigarette },
                  { id: 'alcohol', label: 'Alcohol Consumer', icon: Droplets }
                ].map((habit) => (
                  <label
                    key={habit.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData[habit.id]
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData[habit.id]}
                      onChange={(e) => handleInputChange(habit.id, e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      formData[habit.id] ? 'bg-primary-500 border-primary-500' : 'border-dark-600'
                    }`}>
                      {formData[habit.id] && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <habit.icon className={`w-5 h-5 ${formData[habit.id] ? 'text-primary-400' : 'text-dark-400'}`} />
                    <span className={formData[habit.id] ? 'text-primary-400' : 'text-dark-300'}>{habit.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div ref={stepRef} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Health Goals</h2>
              <p className="text-dark-400">Select up to 3 goals you want to achieve</p>
            </div>

            {/* Health Goals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-dark-300">Your Goals ({formData.healthGoals.length}/3)</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleGoalToggle(goal.id)}
                    disabled={!formData.healthGoals.includes(goal.id) && formData.healthGoals.length >= 3}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      formData.healthGoals.includes(goal.id)
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 bg-dark-800/50 hover:border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <p className={formData.healthGoals.includes(goal.id) ? 'text-primary-400 font-medium' : 'text-white'}>{goal.label}</p>
                        <p className="text-xs text-dark-400">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                Medical Conditions (if any)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MEDICAL_CONDITIONS.map((condition) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => handleConditionToggle(condition.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      formData.medicalConditions.includes(condition.id)
                        ? 'border-warning bg-warning/10 text-warning'
                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                    }`}
                  >
                    {condition.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div ref={stepRef} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Personalized Questions</h2>
              <p className="text-dark-400">
                {questionMeta.totalQuestions > 0
                  ? `${questionMeta.totalQuestions} questions tailored just for you`
                  : 'AI is generating personalized questions based on your profile'}
              </p>
              {questionMeta.estimatedTime && (
                <p className="text-dark-500 text-sm mt-1">Estimated time: {questionMeta.estimatedTime}</p>
              )}
            </div>

            {isLoadingQuestions ? (
              <div className="text-center py-12">
                {/* Animated Icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin"></div>
                  {/* Inner pulsing circle */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 animate-pulse"></div>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl animate-bounce">{loaderStages[loaderStage].icon}</span>
                  </div>
                </div>

                {/* Stage text with fade animation */}
                <div className="min-h-[60px]">
                  <p className="text-lg font-medium text-white mb-2 transition-all duration-500">
                    {loaderStages[loaderStage].text}
                  </p>
                  <p className="text-dark-400 text-sm transition-all duration-500">
                    {loaderStages[loaderStage].subtext}
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {loaderStages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === loaderStage
                          ? 'w-6 bg-primary-500'
                          : idx < loaderStage
                            ? 'bg-primary-500/50'
                            : 'bg-dark-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Helpful tip */}
                <div className="mt-8 p-4 rounded-xl bg-dark-800/50 border border-dark-700 max-w-sm mx-auto">
                  <p className="text-dark-400 text-xs">
                    💡 <span className="text-dark-300">Tip:</span> These questions help our AI create a highly personalized health plan just for you
                  </p>
                </div>
              </div>
            ) : questionCategories.length > 0 ? (
              <div className="space-y-8">
                {questionCategories.map((category) => (
                  <div key={category.id} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-dark-800">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                    </div>

                    {/* Questions in this category */}
                    <div className="space-y-5 pl-2">
                      {category.questions.map((question) => (
                        <div key={question.id}>
                          <label className="block text-sm font-medium text-dark-300 mb-2">
                            {question.question}
                            {question.required && <span className="text-error ml-1">*</span>}
                          </label>
                          {question.rationale && (
                            <p className="text-xs text-dark-500 mb-3 italic">{question.rationale}</p>
                          )}

                          {/* Select type - single choice */}
                          {question.type === 'select' && question.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleConditionalAnswer(question.id, option)}
                                  className={`p-3 rounded-xl border transition-all text-sm ${
                                    formData.conditionalAnswers[question.id] === option
                                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                      : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Multiselect type - multiple choices */}
                          {question.type === 'multiselect' && question.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option, idx) => {
                                const selectedOptions = formData.conditionalAnswers[question.id] || []
                                const isSelected = selectedOptions.includes(option)
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      const current = formData.conditionalAnswers[question.id] || []
                                      const updated = isSelected
                                        ? current.filter(o => o !== option)
                                        : [...current, option]
                                      handleConditionalAnswer(question.id, updated)
                                    }}
                                    className={`p-3 rounded-xl border transition-all text-sm flex items-center gap-2 ${
                                      isSelected
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                        : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-dark-600'
                                    }`}>
                                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    {option}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Boolean type - Yes/No */}
                          {question.type === 'boolean' && (
                            <div className="flex gap-3">
                              {['Yes', 'No'].map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => handleConditionalAnswer(question.id, option === 'Yes')}
                                  className={`flex-1 p-3 rounded-xl border transition-all ${
                                    formData.conditionalAnswers[question.id] === (option === 'Yes')
                                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                      : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-600'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Scale type - 1-10 slider */}
                          {question.type === 'scale' && (
                            <div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.conditionalAnswers[question.id] || 5}
                                onChange={(e) => handleConditionalAnswer(question.id, parseInt(e.target.value))}
                                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                              />
                              <div className="flex justify-between text-xs text-dark-400 mt-1">
                                <span>1 (Low)</span>
                                <span className="text-primary-400 font-medium">{formData.conditionalAnswers[question.id] || 5}</span>
                                <span>10 (High)</span>
                              </div>
                            </div>
                          )}

                          {/* Number type */}
                          {question.type === 'number' && (
                            <input
                              type="number"
                              value={formData.conditionalAnswers[question.id] || ''}
                              onChange={(e) => handleConditionalAnswer(question.id, e.target.value)}
                              className="input w-full"
                              placeholder={question.placeholder || 'Enter a number'}
                            />
                          )}

                          {/* Text type */}
                          {question.type === 'text' && (
                            <input
                              type="text"
                              value={formData.conditionalAnswers[question.id] || ''}
                              onChange={(e) => handleConditionalAnswer(question.id, e.target.value)}
                              className="input w-full"
                              placeholder={question.placeholder || 'Enter your answer'}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-dark-400">No additional questions based on your selections.</p>
                <p className="text-dark-500 text-sm mt-2">Click "Complete Setup" to finish your onboarding.</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen-safe bg-dark-950 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 safe-area-inset">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">VitalFlow</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  step < currentStep
                    ? 'bg-primary-500 text-white'
                    : step === currentStep
                      ? 'bg-primary-500/20 text-primary-400 border-2 border-primary-500'
                      : 'bg-dark-800 text-dark-500'
                }`}
              >
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-1 mx-2 rounded-full ${step < currentStep ? 'bg-primary-500' : 'bg-dark-800'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card p-6 lg:p-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-800">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                disabled={isLoading}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={nextStep}
              disabled={isLoading || !isStepValid()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : currentStep === 4 ? (
                isLoadingQuestions ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Preparing Questions...
                  </>
                ) : !areRequiredQuestionsAnswered && requiredQuestions.length > 0 ? (
                  <>
                    Answer Required Questions
                    <AlertCircle className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-5 h-5" />
                  </>
                )
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
