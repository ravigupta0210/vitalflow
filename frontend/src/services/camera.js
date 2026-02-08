/**
 * Camera Service for VitalFlow Mobile App
 * Handles camera and photo library access for profile pictures
 */

import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import api from './api'

const isNative = Capacitor.isNativePlatform()

/**
 * Check if camera is available
 */
export const isCameraAvailable = () => {
  return isNative
}

/**
 * Request camera permissions
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestCameraPermission = async () => {
  if (!isNative) {
    return true // Web doesn't need explicit permission
  }

  try {
    const result = await Camera.requestPermissions()
    return result.camera === 'granted' && result.photos === 'granted'
  } catch (error) {
    console.error('[Camera] Permission request failed:', error)
    return false
  }
}

/**
 * Check camera permissions
 * @returns {Promise<object>} - Permission status
 */
export const checkCameraPermission = async () => {
  if (!isNative) {
    return { camera: 'granted', photos: 'granted' }
  }

  try {
    return await Camera.checkPermissions()
  } catch (error) {
    console.error('[Camera] Permission check failed:', error)
    return { camera: 'denied', photos: 'denied' }
  }
}

/**
 * Take a photo with the camera
 * @param {object} options - Camera options
 * @returns {Promise<object|null>} - Photo result or null
 */
export const takePhoto = async (options = {}) => {
  try {
    const photo = await Camera.getPhoto({
      quality: options.quality || 80,
      allowEditing: options.allowEditing !== false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: options.width || 512,
      height: options.height || 512,
      correctOrientation: true
    })

    return {
      base64: photo.base64String,
      format: photo.format,
      webPath: photo.webPath
    }
  } catch (error) {
    if (error.message === 'User cancelled photos app') {
      console.log('[Camera] User cancelled')
      return null
    }
    console.error('[Camera] Take photo failed:', error)
    throw error
  }
}

/**
 * Pick a photo from the gallery
 * @param {object} options - Photo options
 * @returns {Promise<object|null>} - Photo result or null
 */
export const pickPhoto = async (options = {}) => {
  try {
    const photo = await Camera.getPhoto({
      quality: options.quality || 80,
      allowEditing: options.allowEditing !== false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: options.width || 512,
      height: options.height || 512,
      correctOrientation: true
    })

    return {
      base64: photo.base64String,
      format: photo.format,
      webPath: photo.webPath
    }
  } catch (error) {
    if (error.message === 'User cancelled photos app') {
      console.log('[Camera] User cancelled')
      return null
    }
    console.error('[Camera] Pick photo failed:', error)
    throw error
  }
}

/**
 * Show photo picker with choice between camera and gallery
 * @param {object} options - Photo options
 * @returns {Promise<object|null>} - Photo result or null
 */
export const getPhoto = async (options = {}) => {
  try {
    const photo = await Camera.getPhoto({
      quality: options.quality || 80,
      allowEditing: options.allowEditing !== false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Let user choose camera or gallery
      width: options.width || 512,
      height: options.height || 512,
      correctOrientation: true,
      promptLabelHeader: 'Profile Photo',
      promptLabelCancel: 'Cancel',
      promptLabelPhoto: 'From Gallery',
      promptLabelPicture: 'Take Photo'
    })

    return {
      base64: photo.base64String,
      format: photo.format,
      webPath: photo.webPath
    }
  } catch (error) {
    if (error.message === 'User cancelled photos app') {
      console.log('[Camera] User cancelled')
      return null
    }
    console.error('[Camera] Get photo failed:', error)
    throw error
  }
}

/**
 * Upload profile photo to the server
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} format - Image format (jpeg, png, etc.)
 * @returns {Promise<object>} - Upload result
 */
export const uploadProfilePhoto = async (base64Image, format = 'jpeg') => {
  try {
    const response = await api.post('/profile/avatar', {
      image: base64Image,
      format: format
    })
    return response.data
  } catch (error) {
    console.error('[Camera] Upload failed:', error)
    throw error
  }
}

/**
 * Helper function to get photo and upload as profile picture
 * @returns {Promise<object|null>} - Upload result or null if cancelled
 */
export const updateProfilePhoto = async () => {
  // Get photo from camera or gallery
  const photo = await getPhoto({
    quality: 85,
    width: 512,
    height: 512,
    allowEditing: true
  })

  if (!photo) {
    return null // User cancelled
  }

  // Upload to server
  const result = await uploadProfilePhoto(photo.base64, photo.format)
  return result
}

/**
 * Convert base64 to data URL for preview
 * @param {string} base64 - Base64 encoded image
 * @param {string} format - Image format
 * @returns {string} - Data URL
 */
export const base64ToDataUrl = (base64, format = 'jpeg') => {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mimeType};base64,${base64}`
}

export default {
  isCameraAvailable,
  requestCameraPermission,
  checkCameraPermission,
  takePhoto,
  pickPhoto,
  getPhoto,
  uploadProfilePhoto,
  updateProfilePhoto,
  base64ToDataUrl
}
