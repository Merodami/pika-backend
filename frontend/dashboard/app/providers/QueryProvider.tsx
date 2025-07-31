'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * React Query provider with optimized configuration
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: how long before data is considered stale
            staleTime: 5 * 60 * 1000, // 5 minutes

            // GC time: how long to keep unused data in cache
            gcTime: 10 * 60 * 1000, // 10 minutes

            // Retry configuration
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status
                if (status >= 400 && status < 500) return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },

            // Exponential backoff for retries
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === 'development',

            // Always refetch on reconnect
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Don't retry mutations by default
            retry: false,

            // Log mutation errors in development
            onError: (error) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Mutation error:', error)
              }
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
