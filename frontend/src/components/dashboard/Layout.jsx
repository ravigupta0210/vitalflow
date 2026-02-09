import { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Activity,
  Bell,
  Settings,
  ChevronDown,
  Library
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import BottomNav from '../mobile/BottomNav'
import OfflineBanner from '../mobile/OfflineBanner'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/workouts', icon: Dumbbell, labelKey: 'nav.workouts' },
  { path: '/exercises', icon: Library, labelKey: 'nav.exercises' },
  { path: '/diet', icon: Utensils, labelKey: 'nav.diet' },
  { path: '/chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' }
]

const pageTitleKeys = {
  '/settings': 'nav.settings',
  '/notifications': 'nav.notifications'
}

export default function DashboardLayout() {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode } = useSettings()
  const location = useLocation()
  const navigate = useNavigate()

  const currentNavItem = navItems.find(item => item.path === location.pathname)
  const currentPage = currentNavItem
    ? t(currentNavItem.labelKey)
    : (pageTitleKeys[location.pathname] ? t(pageTitleKeys[location.pathname]) : t('nav.dashboard'))

  return (
    <div className={`h-screen-safe flex overflow-hidden ${isDarkMode ? 'bg-dark-950' : 'bg-gray-50'}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Fixed with safe area */}
      <aside
        className={`fixed left-0 z-50 w-64 backdrop-blur-xl border-r transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDarkMode ? 'bg-dark-900/50 border-dark-800' : 'bg-white border-gray-200'}`}
        style={{
          top: 'env(safe-area-inset-top, 0px)',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 px-6 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('app_name')}</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className={`lg:hidden ${isDarkMode ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-l-2 ${
                        isDarkMode
                          ? 'bg-primary-500/10 text-primary-400 border-primary-500'
                          : 'bg-primary-50 text-primary-600 border-primary-500'
                      }`
                    : `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isDarkMode
                          ? 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-dark-800/50' : 'bg-gray-100'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-medium">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-dark-400' : 'text-gray-500'}`}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className={`mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:text-error hover:bg-error/10 transition-all duration-300 ${
                isDarkMode ? 'text-dark-400' : 'text-gray-500'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header - Fixed with safe area */}
        <header
          className={`fixed right-0 left-0 lg:left-64 h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 lg:px-6 z-40 ${
            isDarkMode ? 'bg-dark-900/50 border-dark-800' : 'bg-white/80 border-gray-200'
          }`}
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className={`lg:hidden ${isDarkMode ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentPage}</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              aria-label="View notifications"
              className={`relative p-2 rounded-lg transition-all ${
                location.pathname === '/notifications'
                  ? 'text-primary-400 ' + (isDarkMode ? 'bg-dark-800/50' : 'bg-gray-100')
                  : isDarkMode
                    ? 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              aria-label="Open settings"
              className={`p-2 rounded-lg transition-all ${
                location.pathname === '/settings'
                  ? 'text-primary-400 ' + (isDarkMode ? 'bg-dark-800/50' : 'bg-gray-100')
                  : isDarkMode
                    ? 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Toggle user menu"
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  isDarkMode ? 'hover:bg-dark-800/50' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''} ${
                  isDarkMode ? 'text-dark-400' : 'text-gray-400'
                }`} />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  ></div>
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden border ${
                    isDarkMode ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`p-3 border-b ${isDarkMode ? 'border-dark-800' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.firstName} {user?.lastName}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-dark-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <NavLink
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>{t('nav.profile')}</span>
                      </NavLink>
                      <button
                        onClick={logout}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'text-dark-300 hover:text-error hover:bg-error/10'
                            : 'text-gray-600 hover:text-error hover:bg-error/10'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content - offset by fixed header height and bottom nav on mobile */}
        <main
          className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto has-bottom-nav lg:pb-6 scroll-touch ${isDarkMode ? 'bg-dark-950' : 'bg-gray-50'}`}
          style={{ marginTop: 'calc(64px + env(safe-area-inset-top, 0px))' }}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
