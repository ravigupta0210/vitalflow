import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitalflow.app',
  appName: 'VitalFlow',
  webDir: 'dist',
  server: {
    // Use https scheme for better security
    androidScheme: 'https',
    iosScheme: 'https',
    // Uncomment below for development with live reload
    // url: 'http://YOUR_IP:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // iOS camera permissions
    },
  },
  android: {
    allowMixedContent: true,  // Allow HTTP for development
    captureInput: true,
    webContentsDebuggingEnabled: true,  // Enable debugging for development
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
};

export default config;
