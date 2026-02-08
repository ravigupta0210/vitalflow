/**
 * Skeleton loading components for VitalFlow
 */

// Basic skeleton pulse animation
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-dark-800 rounded ${className}`} />
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

// Metric card skeleton
function MetricCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

// Exercise card skeleton
function ExerciseCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

// Meal card skeleton
function MealCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

// Chat message skeleton
function ChatMessageSkeleton({ isUser = false }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <Skeleton className={`h-16 ${isUser ? 'w-48' : 'w-64'} rounded-xl`} />
      </div>
    </div>
  )
}

// Dashboard skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Charts */}
      <div className="card p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}

// Workouts page skeleton
function WorkoutsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Workout overview */}
      <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <ExerciseCardSkeleton />
        <ExerciseCardSkeleton />
        <ExerciseCardSkeleton />
        <ExerciseCardSkeleton />
      </div>
    </div>
  )
}

// Diet page skeleton
function DietSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Nutrition overview */}
      <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <MealCardSkeleton />
        <MealCardSkeleton />
        <MealCardSkeleton />
        <MealCardSkeleton />
      </div>
    </div>
  )
}

// Profile page skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Settings */}
      <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  MetricCardSkeleton,
  ExerciseCardSkeleton,
  MealCardSkeleton,
  ChatMessageSkeleton,
  DashboardSkeleton,
  WorkoutsSkeleton,
  DietSkeleton,
  ProfileSkeleton
}
