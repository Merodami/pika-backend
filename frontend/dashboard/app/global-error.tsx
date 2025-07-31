'use client'

// Global error boundary - fallback for when locale-specific error fails
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Don't render for Next.js internal navigation errors
  if (
    error.message === 'NEXT_REDIRECT' ||
    error.message?.includes('NEXT_REDIRECT')
  ) {
    return null
  }

  if (
    error.message === 'NEXT_NOT_FOUND' ||
    error.message?.includes('NEXT_NOT_FOUND')
  ) {
    return null
  }
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, we encountered an error while processing your request.
            </p>
            <div className="space-x-4">
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
