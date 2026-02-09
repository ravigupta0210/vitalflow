import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import useSWR, { SWRConfig, useSWRConfig } from 'swr'
import api from '../services/api'
import { useAuth } from './AuthContext'

const HealthContext = createContext(null)

// Optimized fetcher with error handling
const fetcher = async (url) => {
  const response = await api.get(url)
  return response.data.data
}

// Global SWR configuration for optimal caching
const swrConfig = {
  revalidateOnFocus: true, // Revalidate when user returns to tab
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5s
  focusThrottleInterval: 10000,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
  keepPreviousData: false, // Don't show stale data from other users
}

export function HealthProvider({ children }) {
  const { user, isAuthenticated, isOnboarded } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { cache, mutate: globalMutate } = useSWRConfig()
  const previousUserIdRef = useRef(null)

  // Clear all SWR cache when user changes or logs out
  useEffect(() => {
    const currentUserId = user?.id || null

    // If user changed (including logout), clear all cache
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
      // Clear all SWR cache
      const keys = []
      // @ts-ignore - cache.keys() exists
      if (cache.keys) {
        for (const key of cache.keys()) {
          keys.push(key)
        }
      }
      keys.forEach(key => {
        globalMutate(key, undefined, { revalidate: false })
      })

      console.log('Cache cleared due to user change')
    }

    previousUserIdRef.current = currentUserId
  }, [user?.id, cache, globalMutate])

  // SWR's own dedupingInterval handles dedup - no manual prefetch needed

  // Dashboard data - only fetch when authenticated and onboarded
  const { data: dashboardData, mutate: mutateDashboard, isLoading: dashboardLoading } = useSWR(
    isAuthenticated && isOnboarded ? '/dashboard' : null,
    fetcher,
    {
      ...swrConfig,
      revalidateIfStale: true,
    }
  )

  // Health insights - longer cache since AI-generated
  const { data: insights, mutate: mutateInsights, isLoading: insightsLoading } = useSWR(
    isAuthenticated && isOnboarded ? '/dashboard/insights' : null,
    fetcher,
    {
      ...swrConfig,
      dedupingInterval: 30000, // AI insights cached longer
    }
  )

  // Today's workout
  const { data: todayWorkout, mutate: mutateTodayWorkout } = useSWR(
    isAuthenticated && isOnboarded ? '/workouts/today' : null,
    fetcher,
    swrConfig
  )

  // Today's meals
  const { data: todayMeals, mutate: mutateTodayMeals } = useSWR(
    isAuthenticated && isOnboarded ? '/diet/today' : null,
    fetcher,
    swrConfig
  )

  // User profile with health data
  const { data: profile, mutate: mutateProfile } = useSWR(
    isAuthenticated ? '/profile' : null,
    fetcher,
    swrConfig
  )

  // Log daily metrics with optimistic update
  const logMetrics = useCallback(async (metrics) => {
    // Optimistic update - immediately update UI
    const optimisticData = dashboardData ? {
      ...dashboardData,
      todayMetrics: { ...dashboardData.todayMetrics, ...metrics }
    } : null

    try {
      // Optimistically update dashboard while request in flight
      if (optimisticData) {
        mutateDashboard(optimisticData, false)
      }

      const response = await api.post('/dashboard/metrics', metrics)

      // Revalidate with actual data
      mutateDashboard()
      mutateInsights()
      return { success: true, data: response.data.data }
    } catch (error) {
      // Revert on error
      mutateDashboard()
      return { success: false, message: error.response?.data?.message || 'Failed to log metrics' }
    }
  }, [mutateDashboard, mutateInsights, dashboardData])

  // Log workout with optimistic update
  const logWorkout = useCallback(async (workoutData) => {
    // Optimistic update
    const optimisticWorkout = todayWorkout ? {
      ...todayWorkout,
      completed: true,
      completedAt: new Date().toISOString()
    } : null

    try {
      if (optimisticWorkout) {
        mutateTodayWorkout(optimisticWorkout, false)
      }

      const response = await api.post('/workouts/log', workoutData)
      mutateTodayWorkout()
      mutateDashboard()
      return { success: true, data: response.data.data }
    } catch (error) {
      mutateTodayWorkout()
      return { success: false, message: error.response?.data?.message || 'Failed to log workout' }
    }
  }, [mutateTodayWorkout, mutateDashboard, todayWorkout])

  // Log food with optimistic update
  const logFood = useCallback(async (foodData) => {
    // Optimistic update - add food to meals list
    const optimisticMeals = todayMeals ? {
      ...todayMeals,
      meals: [...(todayMeals.meals || []), { ...foodData, id: 'temp-' + Date.now() }]
    } : null

    try {
      if (optimisticMeals) {
        mutateTodayMeals(optimisticMeals, false)
      }

      const response = await api.post('/diet/log', foodData)
      mutateTodayMeals()
      mutateDashboard()
      return { success: true, data: response.data.data }
    } catch (error) {
      mutateTodayMeals()
      return { success: false, message: error.response?.data?.message || 'Failed to log food' }
    }
  }, [mutateTodayMeals, mutateDashboard, todayMeals])

  // Generate new workout plan
  const generateWorkout = useCallback(async () => {
    try {
      const response = await api.post('/workouts/generate')
      mutateTodayWorkout()
      return { success: true, data: response.data.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to generate workout' }
    }
  }, [mutateTodayWorkout])

  // Generate new diet plan
  const generateDiet = useCallback(async () => {
    try {
      const response = await api.post('/diet/generate')
      mutateTodayMeals()
      return { success: true, data: response.data.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to generate diet plan' }
    }
  }, [mutateTodayMeals])

  // Refresh all data
  const refreshAll = useCallback(() => {
    mutateDashboard()
    mutateInsights()
    mutateTodayWorkout()
    mutateTodayMeals()
    mutateProfile()
  }, [mutateDashboard, mutateInsights, mutateTodayWorkout, mutateTodayMeals, mutateProfile])

  // Clear all cache (call on logout)
  const clearAllCache = useCallback(() => {
    const keys = []
    // @ts-ignore - cache.keys() exists
    if (cache.keys) {
      for (const key of cache.keys()) {
        keys.push(key)
      }
    }
    keys.forEach(key => {
      globalMutate(key, undefined, { revalidate: false })
    })
  }, [cache, globalMutate])

  const value = {
    // Data
    dashboardData,
    insights,
    todayWorkout,
    todayMeals,
    profile,
    selectedDate,

    // Loading states
    isLoading: dashboardLoading || insightsLoading,
    dashboardLoading,
    insightsLoading,

    // Actions
    setSelectedDate,
    logMetrics,
    logWorkout,
    logFood,
    generateWorkout,
    generateDiet,
    refreshAll,
    clearAllCache,

    // Mutators for optimistic updates
    mutateDashboard,
    mutateInsights,
    mutateTodayWorkout,
    mutateTodayMeals,
    mutateProfile
  }

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  )
}

export function useHealth() {
  const context = useContext(HealthContext)
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider')
  }
  return context
}
