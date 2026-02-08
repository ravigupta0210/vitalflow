# VitalFlow Mobile App - Capacitor Setup

This document describes the mobile app configuration for VitalFlow using Capacitor.

## Project Structure

```
frontend/
├── android/                    # Android native project
├── ios/                        # iOS native project
├── resources/                  # App icon and splash screen sources
│   ├── icon.svg               # App icon source
│   ├── splash.svg             # Splash screen source
│   └── README.md              # Asset generation instructions
├── capacitor.config.ts        # Capacitor configuration
└── src/
    ├── components/
    │   └── mobile/
    │       ├── BottomNav.jsx   # Mobile bottom navigation
    │       └── OfflineBanner.jsx # Offline status indicator
    ├── hooks/
    │   └── useCapacitor.js     # Capacitor feature hooks
    └── services/
        ├── storage.js          # Platform-aware storage (web/native)
        ├── pushNotifications.js # Push notification service
        └── camera.js           # Camera/photo service
```

## Quick Start

### Development

```bash
# Run web development server
npm run dev

# Build for mobile
npm run build

# Sync with native projects
npx cap sync

# Open Android Studio
npm run cap:android

# Open Xcode
npm run cap:ios
```

### Building for Distribution

#### Android APK

1. Open Android Studio: `npm run cap:android`
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### iOS IPA

1. Open Xcode: `npm run cap:ios`
2. Product > Archive
3. Distribute App > Ad Hoc
4. Upload to Diawi.com for distribution

## Features Implemented

### Platform Detection

```javascript
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const platform = Capacitor.getPlatform() // 'web', 'ios', 'android'
```

### Secure Storage

The app uses platform-aware storage that works on both web and native:

```javascript
import { Storage, AuthStorage } from './services/storage'

// Generic storage
await Storage.setItem('key', value)
const value = await Storage.getItem('key')

// Auth-specific storage
await AuthStorage.setTokens(accessToken, refreshToken)
const token = await AuthStorage.getAccessToken()
```

### Mobile Navigation

- **Bottom Navigation**: Visible on mobile screens (< lg breakpoint)
- **Sidebar Navigation**: Visible on desktop screens (>= lg breakpoint)
- **Safe Area Support**: Proper padding for notched devices

### Push Notifications

```javascript
import { registerForPush } from './services/pushNotifications'

// Register for push notifications
await registerForPush(
  (notification) => console.log('Received:', notification),
  (notification, actionId) => console.log('Tapped:', notification)
)
```

### Camera/Photo

```javascript
import { getPhoto, uploadProfilePhoto } from './services/camera'

// Get photo from camera or gallery
const photo = await getPhoto()

// Upload as profile picture
await uploadProfilePhoto(photo.base64, photo.format)
```

### Haptic Feedback

```javascript
import { useHaptics } from './hooks/useCapacitor'

const { impact, notification } = useHaptics()

// Light tap feedback
await impact('light')

// Success notification
await notification('success')
```

### Network Status

```javascript
import { useNetworkStatus } from './hooks/useCapacitor'

const { connected, connectionType } = useNetworkStatus()

if (!connected) {
  // Show offline UI
}
```

## Configuration Files

### capacitor.config.ts

- App ID: `com.vitalflow.app`
- Web directory: `dist`
- Plugins configured: SplashScreen, StatusBar, Keyboard, PushNotifications, Camera

### Android (AndroidManifest.xml)

- Deep link scheme: `vitalflow://callback`
- Permissions: Internet, Camera, Storage, Network State, Vibrate

### iOS (Info.plist)

- URL scheme: `vitalflow`
- Camera/Photo usage descriptions
- All device orientations supported

## Deep Linking (OAuth)

The app supports deep linking for OAuth callback:

- **URL Scheme**: `vitalflow://callback`
- **Parameters**: `token`, `refresh`, `onboarded`
- **Example**: `vitalflow://callback?token=xxx&refresh=xxx&onboarded=true`

## Backend Requirements

### Push Notifications

Device tokens table added to database:
- `device_tokens` - Stores FCM/APNs tokens

API Endpoints:
- `POST /api/notifications/register-device` - Register device token
- `DELETE /api/notifications/unregister-device` - Unregister device token

### OAuth Mobile Redirect

Update backend OAuth callback to support mobile redirect:
- Query param: `redirect=vitalflow://callback`
- Include tokens in redirect URL

## Generating App Icons

1. Convert SVG files in `resources/` to PNG:
   - `icon.png` - 1024x1024 pixels
   - `splash.png` - 2732x2732 pixels

2. Run Capacitor assets generator:
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#0f172a'
   ```

## Web Compatibility

All mobile features gracefully fall back on web:
- Storage uses localStorage
- Push notifications disabled
- Camera uses native file input
- Haptics silently fail
- Deep links handled by browser

## Testing

### Local Testing

1. Build and sync: `npm run mobile:build`
2. Run on emulator via Android Studio or Xcode
3. Test all features: auth, navigation, push, camera

### Device Testing

1. Build debug APK/IPA
2. Install on physical device
3. Test native features that don't work in emulator

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run build
npx cap sync
```

### iOS Pod Issues

```bash
cd ios/App
pod deintegrate
pod install
```

### Android Gradle Issues

```bash
cd android
./gradlew clean
```
