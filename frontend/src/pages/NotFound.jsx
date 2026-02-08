import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Activity } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen-safe bg-dark-950 flex items-center justify-center p-4 sm:p-8 safe-area-inset">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">VitalFlow</span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page not found</h2>
        <p className="text-dark-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
