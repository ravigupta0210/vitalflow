/**
 * Push Notification Service for VitalFlow Mobile App
 * Handles push notification registration and handling for native platforms
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import api from './api'

const isNative = Capacitor.isNativePlatform()
const platform = Capacitor.getPlatform()

/**
 * Check if push notifications are supported on this platform
 */
export const isPushSupported = () => {
  return isNative && (platform === 'android' || platform === 'ios')
}

/**
 * Request push notification permissions
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestPermission = async () => {
  if (!isPushSupported()) {
    console.log('[Push] Not supported on this platform')
    return false
  }

  try {
    const result = await PushNotifications.requestPermissions()
    return result.receive === 'granted'
  } catch (error) {
    console.error('[Push] Permission request failed:', error)
    return false
  }
}

/**
 * Check if push notification permission is granted
 * @returns {Promise<boolean>}
 */
export const checkPermission = async () => {
  if (!isPushSupported()) {
    return false
  }

  try {
    const result = await PushNotifications.checkPermissions()
    return result.receive === 'granted'
  } catch (error) {
    console.error('[Push] Permission check failed:', error)
    return false
  }
}

/**
 * Register for push notifications and get device token
 * @param {function} onNotification - Callback when notification is received
 * @param {function} onAction - Callback when notification is tapped
 * @returns {Promise<string|null>} - Device token or null if failed
 */
export const registerForPush = async (onNotification, onAction) => {
  if (!isPushSupported()) {
    console.log('[Push] Not supported on this platform')
    return null
  }

  // Check/request permission
  const hasPermission = await checkPermission()
  if (!hasPermission) {
    const granted = await requestPermission()
    if (!granted) {
      console.log('[Push] Permission denied')
      return null
    }
  }

  return new Promise((resolve) => {
    // Registration success - got device token
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Registration successful, token:', token.value.substring(0, 20) + '...')

      // Send token to backend
      try {
        await api.post('/notifications/register-device', {
          token: token.value,
          platform: platform,
          deviceName: `${platform} device`
        })
        console.log('[Push] Token registered with backend')
      } catch (error) {
        console.error('[Push] Failed to register token with backend:', error)
      }

      resolve(token.value)
    })

    // Registration failed
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration failed:', error)
      resolve(null)
    })

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Received in foreground:', notification)
      if (onNotification) {
        onNotification(notification)
      }
    })

    // User tapped on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Action performed:', action)
      if (onAction) {
        onAction(action.notification, action.actionId)
      }
    })

    // Register with the push notification service
    PushNotifications.register()
  })
}

/**
 * Unregister from push notifications
 */
export const unregisterFromPush = async () => {
  if (!isPushSupported()) {
    return
  }

  try {
    // Remove all listeners
    await PushNotifications.removeAllListeners()
    console.log('[Push] Unregistered from push notifications')
  } catch (error) {
    console.error('[Push] Unregister failed:', error)
  }
}

/**
 * Get the list of delivered notifications
 * @returns {Promise<array>}
 */
export const getDeliveredNotifications = async () => {
  if (!isPushSupported()) {
    return []
  }

  try {
    const result = await PushNotifications.getDeliveredNotifications()
    return result.notifications
  } catch (error) {
    console.error('[Push] Failed to get delivered notifications:', error)
    return []
  }
}

/**
 * Remove specific delivered notifications
 * @param {array} ids - Notification IDs to remove
 */
export const removeDeliveredNotifications = async (ids) => {
  if (!isPushSupported()) {
    return
  }

  try {
    await PushNotifications.removeDeliveredNotifications({ notifications: ids.map(id => ({ id })) })
  } catch (error) {
    console.error('[Push] Failed to remove notifications:', error)
  }
}

/**
 * Remove all delivered notifications
 */
export const removeAllDeliveredNotifications = async () => {
  if (!isPushSupported()) {
    return
  }

  try {
    await PushNotifications.removeAllDeliveredNotifications()
  } catch (error) {
    console.error('[Push] Failed to remove all notifications:', error)
  }
}

/**
 * Handle notification action based on data
 * @param {object} notification - The notification object
 * @param {function} navigate - React Router navigate function
 */
export const handleNotificationAction = (notification, navigate) => {
  const data = notification.data || {}

  switch (data.action) {
    case 'open_workouts':
      navigate('/workouts')
      break
    case 'open_diet':
      navigate('/diet')
      break
    case 'open_dashboard':
      navigate('/dashboard')
      break
    case 'open_profile':
      navigate('/profile')
      break
    case 'open_chat':
      navigate('/chat')
      break
    case 'open_notifications':
      navigate('/notifications')
      break
    default:
      // Default to dashboard
      navigate('/dashboard')
  }
}

export default {
  isPushSupported,
  requestPermission,
  checkPermission,
  registerForPush,
  unregisterFromPush,
  getDeliveredNotifications,
  removeDeliveredNotifications,
  removeAllDeliveredNotifications,
  handleNotificationAction
}
