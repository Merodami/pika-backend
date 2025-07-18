import { API, createRetryApiClient } from '@pika/sdk'
import { get, set } from 'lodash-es'
import { toast } from 'sonner'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/tokens'

// Configuration for retry client
const RETRY_CONFIG = {
  maxRetries: 3,
  timeout: 30000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
}

// Create a singleton instance
let apiInstance: API | null = null

// Token management
async function getAuthToken(): Promise<string> {
  const token = getAccessToken()

  return token ? `Bearer ${token}` : ''
}

// Refresh token logic
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return null
  }

  try {
    // Use a temporary client without auth for refresh
    const tempClient = new API({
      BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1',
    })

    const response = await tempClient.auth.refreshToken({
      requestBody: { refresh_token: refreshToken },
    })

    if (response.tokens?.access_token && response.tokens?.refresh_token) {
      setTokens(response.tokens.access_token, response.tokens.refresh_token)

      return response.tokens.access_token
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    clearTokens()
  }

  return null
}

// Handle API errors with toast notifications
function handleApiError(error: any): never {
  if (error?.status >= 400 && error?.status < 500) {
    const message = error?.body?.message || error?.message || 'Request failed'

    toast.error(message)
  } else if (error?.status >= 500) {
    toast.error('Server error. Please try again later.')
  } else if (error?.message) {
    toast.error(error.message)
  }
  throw error
}

// Create wrapper for 401 handling
function wrapWithAuth<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: any
): T {
  return (async (...args: any[]) => {
    try {
      return await fn.apply(context, args)
    } catch (error: any) {
      if (error?.status === 401) {
        const newToken = await refreshAccessToken()

        if (newToken) {
          // Retry the request - the token function will provide the new token
          try {
            return await fn.apply(context, args)
          } catch (retryError) {
            handleApiError(retryError)
          }
        } else {
          clearTokens()
          window.location.href = '/login'
          throw error
        }
      }
      handleApiError(error)
    }
  }) as T
}

// Create and configure the API client
export function createApiClient(): API {
  if (!apiInstance) {
    apiInstance = createRetryApiClient(
      {
        BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1',
        TOKEN: getAuthToken,
        WITH_CREDENTIALS: true,
        HEADERS: {
          'Content-Type': 'application/json',
        },
      },
      RETRY_CONFIG
    )

    // Wrap all service methods with auth handling
    const services = [
      'auth',
      'categories',
      'messaging',
      'notifications',
      'payments',
      'businesses',
      'redemptions',
      'reviews',
      'system',
      'users',
      'vouchers',
    ] as const

    services.forEach((serviceName) => {
      const service = get(apiInstance, serviceName)

      if (service) {
        Object.getOwnPropertyNames(Object.getPrototypeOf(service))
          .filter(
            (name) =>
              name !== 'constructor' && typeof get(service, name) === 'function'
          )
          .forEach((methodName) => {
            const originalMethod = get(service, methodName).bind(service)

            set(service, methodName, wrapWithAuth(originalMethod, service))
          })
      }
    })
  }

  return apiInstance
}

// Export the default API client instance
export const api = createApiClient()

// Helper to reset the client (useful for logout)
export function resetApiClient() {
  apiInstance = null
}

// Re-export types for convenience
export type {
  AuthResponse,
  Category,
  CategoryListResponse,
  Login,
  BusinessProfile,
  Review,
  UserProfile,
  UserRegistration,
  Voucher,
  VoucherListResponse,
} from '@pika/sdk'
