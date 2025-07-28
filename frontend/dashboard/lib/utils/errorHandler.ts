import { AxiosError } from 'axios'

import { showError } from '@/store/notifications.store'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export class AppError extends Error {
  public code?: string
  public status?: number
  public details?: any

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function handleApiError(error: unknown): ApiError {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const data = error.response?.data

    // Common error messages based on status
    const statusMessages: Record<number, string> = {
      400: 'Bad request. Please check your input.',
      401: 'Your session has expired. Please login again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This action conflicts with existing data.',
      422: 'The provided data is invalid.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service is under maintenance.',
    }

    const message =
      data?.message ||
      statusMessages[status || 500] ||
      'An unexpected error occurred'

    return {
      message,
      code: data?.code || 'NETWORK_ERROR',
      status,
      details: data?.details,
    }
  }

  // Handle regular errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    }
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    showError(
      'An unexpected error occurred',
      'Please refresh the page and try again'
    )
  })
}

// Retry logic for failed requests
export async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error

    await new Promise((resolve) => setTimeout(resolve, delay))

    return retryRequest(fn, retries - 1, delay * 2)
  }
}
