import { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'
import {
  Search, Filter, Dumbbell, X, ChevronDown, Play, Info,
  Target, Loader2, Heart, Share2, BookmarkPlus
} from 'lucide-react'
import {
  getBodyParts,
  getEquipmentList,
  getTargetMuscles,
  getExercisesByBodyPart,
  getExercisesByTarget,
  getExercisesByEquipment,
  searchExercises,
  getAllExercises
} from '../services/exerciseDB'

// Exercise Card Component
function ExerciseCard({ exercise, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      onClick={() => onClick(exercise)}
      className="card overflow-hidden cursor-pointer hover:border-primary-500/50 transition-all group"
    >
      {/* GIF Preview */}
      <div className="relative aspect-square bg-dark-800 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
            <Dumbbell className="w-16 h-16 text-dark-600" />
          </div>
        ) : (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3">
            <button className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> View Details
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white capitalize line-clamp-2 mb-2">
          {exercise.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="badge-primary text-xs capitalize">{exercise.bodyPart}</span>
          <span className="badge-secondary text-xs capitalize">{exercise.target}</span>
        </div>
        <p className="text-xs text-dark-500 mt-2 capitalize">{exercise.equipment}</p>
      </div>
    </div>
  )
}

// Exercise Detail Modal
function ExerciseModal({ exercise, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!exercise) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm flex items-center justify-between p-4 border-b border-dark-800 z-10">
          <h2 className="text-lg font-semibold text-white capitalize">{exercise.name}</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-lg hover:bg-dark-800">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* GIF */}
          <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              </div>
            )}
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-sm capitalize">
              <Target className="w-4 h-4 inline mr-1" />
              {exercise.target}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-secondary-500/20 text-secondary-400 text-sm capitalize">
              {exercise.bodyPart}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-dark-700 text-dark-300 text-sm capitalize">
              <Dumbbell className="w-4 h-4 inline mr-1" />
              {exercise.equipment}
            </span>
          </div>

          {/* Secondary Muscles */}
          {exercise.secondaryMuscles?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dark-400 mb-2">Secondary Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.secondaryMuscles.map((muscle, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-md bg-dark-800 text-dark-300 text-xs capitalize">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dark-400 mb-3">Instructions</h3>
              <ol className="space-y-3">
                {exercise.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-dark-300 text-sm">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-dark-800">
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Add to Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Filter Dropdown
function FilterDropdown({ label, options, value, onChange, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          value ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-700 bg-dark-800 text-dark-300 hover:border-dark-600'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span className="capitalize">{value || label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            <button
              onClick={() => { onChange(''); setIsOpen(false) }}
              className="w-full px-4 py-2 text-left text-dark-400 hover:bg-dark-700 text-sm"
            >
              All {label}s
            </button>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => { onChange(option); setIsOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-dark-700 ${
                  value === option ? 'text-primary-400 bg-primary-500/10' : 'text-dark-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ExerciseLibrary() {
  const containerRef = useRef(null)
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(null)

  // Filters
  const [bodyParts, setBodyParts] = useState([])
  const [equipment, setEquipment] = useState([])
  const [targetMuscles, setTargetMuscles] = useState([])
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')

  // Load filter options
  useEffect(() => {
    async function loadFilters() {
      const [parts, equip, targets] = await Promise.all([
        getBodyParts(),
        getEquipmentList(),
        getTargetMuscles()
      ])
      setBodyParts(parts)
      setEquipment(equip)
      setTargetMuscles(targets)
    }
    loadFilters()
  }, [])

  // Load exercises based on filters
  const loadExercises = useCallback(async () => {
    setIsLoading(true)
    try {
      let results = []

      if (searchQuery.trim()) {
        results = await searchExercises(searchQuery.toLowerCase(), 50)
      } else if (selectedBodyPart) {
        results = await getExercisesByBodyPart(selectedBodyPart, 50)
      } else if (selectedTarget) {
        results = await getExercisesByTarget(selectedTarget, 50)
      } else if (selectedEquipment) {
        results = await getExercisesByEquipment(selectedEquipment, 50)
      } else {
        results = await getAllExercises(50, 0)
      }

      setExercises(results)
    } catch (error) {
      console.error('Failed to load exercises:', error)
      setExercises([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedBodyPart, selectedTarget, selectedEquipment])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises()
    }, 300)
    return () => clearTimeout(timer)
  }, [loadExercises])

  // GSAP animations
  useEffect(() => {
    if (!isLoading && containerRef.current && exercises.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.exercise-card', {
          opacity: 0,
          y: 20,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power3.out'
        })
      }, containerRef)
      return () => ctx.revert()
    }
  }, [isLoading, exercises])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedBodyPart('')
    setSelectedEquipment('')
    setSelectedTarget('')
  }

  const hasActiveFilters = searchQuery || selectedBodyPart || selectedEquipment || selectedTarget

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Exercise Library</h1>
        <p className="text-dark-400">Browse 1,300+ exercises with video demonstrations</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-12 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-dark-700"
            >
              <X className="w-4 h-4 text-dark-400" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            label="Body Part"
            options={bodyParts}
            value={selectedBodyPart}
            onChange={(v) => { setSelectedBodyPart(v); setSelectedTarget(''); setSelectedEquipment('') }}
          />
          <FilterDropdown
            label="Target Muscle"
            options={targetMuscles}
            value={selectedTarget}
            onChange={(v) => { setSelectedTarget(v); setSelectedBodyPart(''); setSelectedEquipment('') }}
            icon={Target}
          />
          <FilterDropdown
            label="Equipment"
            options={equipment}
            value={selectedEquipment}
            onChange={(v) => { setSelectedEquipment(v); setSelectedBodyPart(''); setSelectedTarget('') }}
            icon={Dumbbell}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-all"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-square bg-dark-800" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-dark-800 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-dark-800 rounded w-16" />
                  <div className="h-5 bg-dark-800 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : exercises.length > 0 ? (
        <>
          <p className="text-dark-400 text-sm">{exercises.length} exercises found</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="exercise-card">
                <ExerciseCard
                  exercise={exercise}
                  onClick={setSelectedExercise}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <Dumbbell className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No exercises found</h3>
          <p className="text-dark-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}
