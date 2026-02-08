/**
 * Custom hooks for Capacitor native features
 * These hooks provide platform detection and native feature access
 * with graceful fallbacks for web
 */

import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { Keyboard } from '@capacitor/keyboard'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/**
 * Check if running on native platform (iOS/Android)
 */
export const isNativePlatform = () => Capacitor.isNativePlatform()

/**
 * Get the current platform
 * @returns {'ios' | 'android' | 'web'}
 */
export const getPlatform = () => Capacitor.getPlatform()

/**
 * Hook for platform detection
 */
export function usePlatform() {
  const platform = Capacitor.getPlatform()
  const isNative = Capacitor.isNativePlatform()
  const isIOS = platform === 'ios'
  const isAndroid = platform === 'android'
  const isWeb = platform === 'web'

  return {
    platform,
    isNative,
    isIOS,
    isAndroid,
    isWeb
  }
}

/**
 * Hook for app lifecycle events
 */
export function useAppLifecycle(options = {}) {
  const { onResume, onPause, onBackButton } = options
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const stateListener = App.addListener('appStateChange', ({ isActive: active }) => {
      setIsActive(active)
      if (active && onResume) {
        onResume()
      } else if (!active && onPause) {
        onPause()
      }
    })

    const backListener = App.addListener('backButton', ({ canGoBack }) => {
      if (onBackButton) {
        onBackButton(canGoBack)
      } else if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })

    return () => {
      stateListener.then(l => l.remove())
      backListener.then(l => l.remove())
    }
  }, [onResume, onPause, onBackButton])

  return { isActive }
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    connected: true,
    connectionType: 'unknown'
  })

  useEffect(() => {
    let isMounted = true

    // Get initial status
    Network.getStatus().then(networkStatus => {
      if (isMounted) {
        setStatus({
          connected: networkStatus.connected,
          connectionType: networkStatus.connectionType
        })
      }
    })

    // Listen for changes
    const listener = Network.addListener('networkStatusChange', networkStatus => {
      if (isMounted) {
        setStatus({
          connected: networkStatus.connected,
          connectionType: networkStatus.connectionType
        })
      }
    })

    return () => {
      isMounted = false
      listener.then(l => l.remove())
    }
  }, [])

  return status
}

/**
 * Hook for keyboard handling
 */
export function useKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const showListener = Keyboard.addListener('keyboardWillShow', info => {
      setKeyboardVisible(true)
      setKeyboardHeight(info.keyboardHeight)
    })

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    return () => {
      showListener.then(l => l.remove())
      hideListener.then(l => l.remove())
    }
  }, [])

  const hideKeyboard = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide()
    }
  }, [])

  return {
    keyboardVisible,
    keyboardHeight,
    hideKeyboard
  }
}

/**
 * Hook for status bar control
 */
export function useStatusBar() {
  const setStatusBarStyle = useCallback(async (style) => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await StatusBar.setStyle({
        style: style === 'dark' ? Style.Dark : Style.Light
      })
    } catch (e) {
      // Status bar not available
    }
  }, [])

  const setStatusBarColor = useCallback(async (color) => {
    if (!Capacitor.isNativePlatform()) return

    try {
      // Only works on Android
      await StatusBar.setBackgroundColor({ color })
    } catch (e) {
      // Status bar color not available
    }
  }, [])

  const hideStatusBar = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await StatusBar.hide()
    } catch (e) {
      // Status bar hide not available
    }
  }, [])

  const showStatusBar = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await StatusBar.show()
    } catch (e) {
      // Status bar show not available
    }
  }, [])

  return {
    setStatusBarStyle,
    setStatusBarColor,
    hideStatusBar,
    showStatusBar
  }
}

/**
 * Hook for splash screen control
 */
export function useSplashScreen() {
  const hideSplash = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await SplashScreen.hide()
    } catch (e) {
      // Splash screen already hidden
    }
  }, [])

  const showSplash = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await SplashScreen.show({
        autoHide: false
      })
    } catch (e) {
      // Splash screen not available
    }
  }, [])

  return {
    hideSplash,
    showSplash
  }
}

/**
 * Hook for haptic feedback
 */
export function useHaptics() {
  const impact = useCallback(async (style = 'medium') => {
    if (!Capacitor.isNativePlatform()) return

    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style] || ImpactStyle.Medium

      await Haptics.impact({ style: impactStyle })
    } catch (e) {
      // Haptics not available
    }
  }, [])

  const notification = useCallback(async (type = 'success') => {
    if (!Capacitor.isNativePlatform()) return

    try {
      const notificationType = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      }[type] || NotificationType.Success

      await Haptics.notification({ type: notificationType })
    } catch (e) {
      // Haptics not available
    }
  }, [])

  const vibrate = useCallback(async (duration = 300) => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await Haptics.vibrate({ duration })
    } catch (e) {
      // Vibration not available
    }
  }, [])

  const selectionStart = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await Haptics.selectionStart()
    } catch (e) {
      // Haptics not available
    }
  }, [])

  const selectionChanged = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await Haptics.selectionChanged()
    } catch (e) {
      // Haptics not available
    }
  }, [])

  const selectionEnd = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      await Haptics.selectionEnd()
    } catch (e) {
      // Haptics not available
    }
  }, [])

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd
  }
}

/**
 * Combined hook for common Capacitor features
 */
export function useCapacitor(options = {}) {
  const platform = usePlatform()
  const lifecycle = useAppLifecycle(options)
  const network = useNetworkStatus()
  const keyboard = useKeyboard()
  const statusBar = useStatusBar()
  const splash = useSplashScreen()
  const haptics = useHaptics()

  return {
    ...platform,
    ...lifecycle,
    network,
    keyboard,
    statusBar,
    splash,
    haptics
  }
}

export default useCapacitor
