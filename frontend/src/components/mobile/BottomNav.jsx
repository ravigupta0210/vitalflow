import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  MessageCircle,
  User
} from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/workouts', icon: Dumbbell, labelKey: 'nav.workouts' },
  { path: '/diet', icon: Utensils, labelKey: 'nav.diet' },
  { path: '/chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' }
]

export default function BottomNav() {
  const { t } = useTranslation()
  const { isDarkMode } = useSettings()
  const location = useLocation()

  const handleNavClick = async () => {
    // Haptic feedback on native platforms
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light })
      } catch (e) {
        // Haptics not available
      }
    }
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t backdrop-blur-xl ${
        isDarkMode
          ? 'bg-dark-900/95 border-dark-800'
          : 'bg-white/95 border-gray-200'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] touch-target"
            >
              <div
                className={`flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'text-primary-500 scale-110'
                    : isDarkMode
                      ? 'text-dark-400'
                      : 'text-gray-400'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`}
                />
                <span className={`text-[10px] mt-1 font-medium ${
                  isActive ? 'text-primary-500' : ''
                }`}>
                  {t(item.labelKey)}
                </span>
              </div>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 rounded-t-full bg-primary-500" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
