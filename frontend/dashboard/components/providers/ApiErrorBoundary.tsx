'use client'

import { ExclamationCircleOutlined } from '@ant-design/icons'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Button } from 'antd'
import { ErrorBoundary } from 'react-error-boundary'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <ExclamationCircleOutlined className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button type="primary" onClick={resetErrorBoundary}>
          Try again
        </Button>
      </div>
    </div>
  )
}

/**
 * Error boundary for API errors with React Query integration
 */
export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={ErrorFallback}
          onError={(error, errorInfo) => {
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Error boundary caught:', error, errorInfo)
            }
            // TODO: Send to error tracking service (e.g., Sentry)
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
