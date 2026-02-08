import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Error Boundary component for graceful error handling
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="card p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-dark-400 mb-6">
              {this.props.fallbackMessage || "We encountered an unexpected error. Please try again."}
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error message component for API errors
 */
function ErrorMessage({ title, message, onRetry }) {
  return (
    <div className="card p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-error/20 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-error" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title || 'Error'}</h3>
      <p className="text-dark-400 mb-4">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card p-8 text-center">
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <Icon className="w-8 h-8 text-dark-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-dark-400 mb-4">{message}</p>
      {action}
    </div>
  )
}

export { ErrorBoundary, ErrorMessage, EmptyState }
