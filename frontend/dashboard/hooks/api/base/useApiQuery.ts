import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useApiError } from './useApiError'

/**
 * Base hook for API queries with built-in error handling
 * Extends React Query's useQuery with API-specific defaults
 */
export function useApiQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  const handleError = useApiError()

  return useQuery({
    ...options,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false

      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes default
    throwOnError: (error: any) => {
      handleError(error)

      return false // Don't throw, let component handle gracefully
    },
  })
}
