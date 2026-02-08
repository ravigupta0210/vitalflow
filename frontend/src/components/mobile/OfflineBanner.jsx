import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useCapacitor'
import { useSettings } from '../../context/SettingsContext'

export default function OfflineBanner() {
  const { connected } = useNetworkStatus()
  const { isDarkMode } = useSettings()

  if (connected) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium safe-area-top ${
        isDarkMode
          ? 'bg-warning/90 text-dark-900'
          : 'bg-warning text-white'
      }`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)'
      }}
    >
      <WifiOff className="w-4 h-4" />
      <span>You're offline. Some features may be unavailable.</span>
    </div>
  )
}
