import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { ApiError } from '@/lib/api/generated/core/ApiError'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook for centralized API error handling
 * Based on backend ErrorCode enum from @pika/types
 */
export function useApiError() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  return (error: ApiError | any) => {
    // SDK ApiError has: status, statusText, body
    const status = error?.status
    const body = error?.body

    // Our backend returns errors in this format:
    // { statusCode: number, error: string, message: string, details?: Array }
    const errorMessage = body?.message || error?.message || 'An error occurred'
    const details = body?.details

    // Check if the error message contains specific error codes from backend
    const hasErrorCode = (code: string) => errorMessage?.includes?.(code)

    // Handle specific backend error codes
    if (
      hasErrorCode('UNAUTHORIZED') ||
      hasErrorCode('NOT_AUTHENTICATED') ||
      status === 401
    ) {
      logout()
      router.push('/login')
      toast.error('Session expired. Please login again.')

      return
    }

    if (
      hasErrorCode('FORBIDDEN') ||
      hasErrorCode('NOT_AUTHORIZED') ||
      status === 403
    ) {
      toast.error('You do not have permission to perform this action.')

      return
    }

    if (hasErrorCode('VALIDATION_ERROR') || (status === 400 && details)) {
      // Show field-specific validation errors
      if (Array.isArray(details)) {
        details.forEach((detail) => {
          toast.error(`${detail.field}: ${detail.message}`)
        })
      } else {
        toast.error(errorMessage)
      }

      return
    }

    if (hasErrorCode('RATE_LIMIT_EXCEEDED') || status === 429) {
      toast.warning('Too many requests. Please try again later.')

      return
    }

    if (
      hasErrorCode('NOT_FOUND') ||
      hasErrorCode('ITEM_NOT_FOUND') ||
      status === 404
    ) {
      toast.error('The requested resource was not found.')

      return
    }

    if (
      hasErrorCode('CONFLICT') ||
      hasErrorCode('DUPLICATE_ENTITY') ||
      hasErrorCode('ITEM_ALREADY_EXISTS') ||
      status === 409
    ) {
      toast.error(errorMessage || 'This action conflicts with existing data.')

      return
    }

    if (hasErrorCode('SERVICE_UNAVAILABLE') || status === 503) {
      toast.error('Service temporarily unavailable. Please try again later.')

      return
    }

    if (hasErrorCode('EXTERNAL_SERVICE_ERROR') || status === 502) {
      toast.error('Error communicating with external service.')

      return
    }

    // Handle by status code if no specific error code matched
    if (status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (status >= 400 && status < 500) {
      toast.error(errorMessage)
    } else {
      toast.error(errorMessage)
    }

    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status,
        statusText: error?.statusText,
        body,
        url: error?.url,
        message: errorMessage,
      })
    }
  }
}
