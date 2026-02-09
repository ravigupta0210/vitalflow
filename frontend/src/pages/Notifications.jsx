import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Check,
  CheckCheck,
  Dumbbell,
  Utensils,
  Trophy,
  Calendar,
  TrendingUp,
  MessageCircle,
  Clock,
  Trash2,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Shield
} from 'lucide-react'
import api from '../services/api'
import { useSettings } from '../context/SettingsContext'

// Map notification types to icons
const typeIcons = {
  welcome: Sparkles,
  workout: Dumbbell,
  achievement: Trophy,
  diet: Utensils,
  progress: TrendingUp,
  chat: MessageCircle,
  calendar: Calendar,
  reminder: Bell,
  system: Shield
}

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

export default function Notifications() {
  const { t } = useTranslation()
  const { isDarkMode } = useSettings()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true)
      setError(null)

      const filterParam = filter === 'all' ? '' : `?filter=${filter}`
      const response = await api.get(`/notifications${filterParam}`)

      if (response.data.success) {
        setNotifications(response.data.notifications)
        setUnreadCount(response.data.unreadCount)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  // Initial load and filter change
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`)
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all')
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const deleteNotification = async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`)
      if (response.data.success) {
        const notification = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const clearAll = async () => {
    try {
      const response = await api.delete('/notifications/clear-all')
      if (response.data.success) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'welcome': return 'text-primary-400 bg-primary-500/10'
      case 'workout': return 'text-primary-400 bg-primary-500/10'
      case 'achievement': return 'text-warning bg-warning/10'
      case 'diet': return 'text-success bg-success/10'
      case 'progress': return 'text-secondary-400 bg-secondary-500/10'
      case 'chat': return 'text-info bg-info/10'
      case 'calendar': return 'text-purple-400 bg-purple-500/10'
      case 'reminder': return 'text-orange-400 bg-orange-500/10'
      case 'system': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-dark-400 bg-dark-800'
    }
  }

  const getIcon = (type) => {
    return typeIcons[type] || Bell
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications_page.title')}</h1>
          <p className={`mt-1 ${isDarkMode ? 'text-dark-400' : 'text-gray-500'}`}>
            {unreadCount > 0
              ? (unreadCount > 1
                  ? t('notifications_page.unread_count_plural', { count: unreadCount })
                  : t('notifications_page.unread_count', { count: unreadCount }))
              : t('notifications_page.all_caught_up')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 p-2 disabled:opacity-50 rounded-lg transition-all ${
              isDarkMode ? 'bg-dark-800 hover:bg-dark-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all ${
              isDarkMode ? 'bg-dark-800 hover:bg-dark-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            {t('notifications_page.mark_all_read')}
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 disabled:opacity-50 disabled:cursor-not-allowed text-error rounded-lg font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('notifications_page.clear_all')}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error" />
          <span className="text-error">{error}</span>
          <button
            onClick={() => fetchNotifications()}
            className="ml-auto text-error hover:text-error/80 underline text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-primary-500 text-white'
                : isDarkMode
                  ? 'bg-dark-800 text-dark-400 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            {f === 'all' ? t('all') : f === 'unread' ? t('notifications_page.unread') : t('notifications_page.read')}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className={`rounded-2xl overflow-hidden border ${
        isDarkMode ? 'bg-dark-900/50 border-dark-800' : 'bg-white border-gray-200'
      }`}>
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-dark-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('notifications_page.no_notifications')}
            </h3>
            <p className={isDarkMode ? 'text-dark-400' : 'text-gray-500'}>
              {filter === 'unread'
                ? t('notifications_page.no_unread')
                : t('notifications_page.no_notifications_yet')}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkMode ? 'divide-dark-800' : 'divide-gray-200'}`}>
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  className={`p-4 transition-all ${
                    !notification.is_read
                      ? 'bg-primary-500/5'
                      : ''
                  } ${isDarkMode ? 'hover:bg-dark-800/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-xl ${getTypeColor(notification.type)}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`font-medium truncate ${
                            !notification.is_read
                              ? (isDarkMode ? 'text-white' : 'text-gray-900')
                              : (isDarkMode ? 'text-dark-300' : 'text-gray-600')
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-0.5 line-clamp-2 ${isDarkMode ? 'text-dark-400' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-dark-500' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(notification.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                            >
                              {t('notifications_page.mark_as_read')}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className={`text-xs hover:text-error font-medium ${isDarkMode ? 'text-dark-500' : 'text-gray-400'}`}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
