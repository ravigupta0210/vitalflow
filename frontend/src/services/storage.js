/**
 * Platform-aware storage service
 * Uses Capacitor Preferences on native platforms (iOS/Android)
 * Falls back to localStorage on web
 *
 * This ensures the same code works seamlessly across all platforms
 */

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const isNative = Capacitor.isNativePlatform()

/**
 * Storage service that works on both web and native platforms
 */
export const Storage = {
  /**
   * Store a value
   * @param {string} key - The key to store under
   * @param {any} value - The value to store (will be JSON stringified)
   */
  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

    if (isNative) {
      await Preferences.set({ key, value: stringValue })
    } else {
      localStorage.setItem(key, stringValue)
    }
  },

  /**
   * Retrieve a value
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} The stored value (parsed from JSON if applicable)
   */
  async getItem(key) {
    if (isNative) {
      const { value } = await Preferences.get({ key })
      if (value === null) return null

      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } else {
      const value = localStorage.getItem(key)
      if (value === null) return null

      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
  },

  /**
   * Remove a value
   * @param {string} key - The key to remove
   */
  async removeItem(key) {
    if (isNative) {
      await Preferences.remove({ key })
    } else {
      localStorage.removeItem(key)
    }
  },

  /**
   * Clear all stored values
   */
  async clear() {
    if (isNative) {
      await Preferences.clear()
    } else {
      localStorage.clear()
    }
  },

  /**
   * Get all keys
   * @returns {Promise<string[]>} Array of all keys
   */
  async keys() {
    if (isNative) {
      const { keys } = await Preferences.keys()
      return keys
    } else {
      return Object.keys(localStorage)
    }
  }
}

/**
 * Auth-specific storage keys
 */
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user'
}

/**
 * Auth storage helpers
 */
export const AuthStorage = {
  async setTokens(accessToken, refreshToken) {
    await Promise.all([
      Storage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken),
      Storage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken)
    ])
  },

  async getAccessToken() {
    return Storage.getItem(AUTH_KEYS.ACCESS_TOKEN)
  },

  async getRefreshToken() {
    return Storage.getItem(AUTH_KEYS.REFRESH_TOKEN)
  },

  async setUser(user) {
    await Storage.setItem(AUTH_KEYS.USER, user)
  },

  async getUser() {
    return Storage.getItem(AUTH_KEYS.USER)
  },

  async clearAuth() {
    await Promise.all([
      Storage.removeItem(AUTH_KEYS.ACCESS_TOKEN),
      Storage.removeItem(AUTH_KEYS.REFRESH_TOKEN),
      Storage.removeItem(AUTH_KEYS.USER)
    ])
  }
}

export default Storage
