// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: {
        value: number
        metric_rating: string
        non_interaction: boolean
      }
    ) => void
  }
}

export function reportWebVitals(metric: any) {
  const { name, value, rating } = metric

  // Log to console in development
  if (process?.env?.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${name}:`, value, rating)
  }

  // Send to analytics service in production
  if (process?.env?.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        metric_rating: rating,
        non_interaction: true,
      })
    }
  }
}

// Performance observer for custom metrics
export function measureApiCall(name: string, fn: () => Promise<any>) {
  const startTime = performance.now()

  return fn().finally(() => {
    const duration = performance.now() - startTime

    if (process?.env?.NODE_ENV === 'development') {
      console.log(`[API Performance] ${name}:`, `${duration.toFixed(2)}ms`)
    }

    // Track slow API calls
    if (duration > 3000) {
      console.warn(
        `Slow API call detected: ${name} took ${duration.toFixed(2)}ms`
      )
    }
  })
}
