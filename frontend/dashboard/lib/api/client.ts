import { toast } from 'sonner'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/tokens'

import { OpenAPI } from './generated/core/OpenAPI'
import { AuthenticationService } from './generated/services/AuthenticationService'
import { BusinessManagementService } from './generated/services/BusinessManagementService'
import { CategoriesService } from './generated/services/CategoriesService'
import { CategoryManagementService } from './generated/services/CategoryManagementService'
import { CommunicationManagementService } from './generated/services/CommunicationManagementService'
import { FinancialManagementService } from './generated/services/FinancialManagementService'
import { MyBusinessService } from './generated/services/MyBusinessService'
import { StorageService } from './generated/services/StorageService'
import { SupportService } from './generated/services/SupportService'
import { UserManagementService } from './generated/services/UserManagementService'
import { UsersService } from './generated/services/UsersService'
import { VoucherManagementService } from './generated/services/VoucherManagementService'
import { VouchersService } from './generated/services/VouchersService'

// Configure OpenAPI client
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1'
OpenAPI.WITH_CREDENTIALS = true
OpenAPI.TOKEN = async () => {
  const token = getAccessToken()

  return token ? `Bearer ${token}` : ''
}

// Configuration for retry
const RETRY_CONFIG = {
  maxRetries: 3,
  timeout: 30000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
}

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
    const response = await AuthenticationService.refreshToken({
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
  serviceName: string,
  methodName: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error: any) {
      if (error?.status === 401) {
        const newToken = await refreshAccessToken()

        if (newToken) {
          // Retry the request
          try {
            return await fn(...args)
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

// Wrap service methods with auth handling
function wrapService<T extends Record<string, any>>(
  service: T,
  serviceName: string
): T {
  const wrappedService = {} as T

  Object.keys(service).forEach((key) => {
    if (typeof service[key] === 'function') {
      wrappedService[key] = wrapWithAuth(
        service[key].bind(service),
        serviceName,
        key
      )
    } else {
      wrappedService[key] = service[key]
    }
  })

  return wrappedService
}

// Create API client interface
export const api = {
  auth: wrapService(AuthenticationService, 'auth'),
  categories: wrapService(CategoriesService, 'categories'),
  categoryManagement: wrapService(
    CategoryManagementService,
    'categoryManagement'
  ),
  businesses: wrapService(MyBusinessService, 'businesses'),
  businessManagement: wrapService(
    BusinessManagementService,
    'businessManagement'
  ),
  users: wrapService(UsersService, 'users'),
  userManagement: wrapService(UserManagementService, 'userManagement'),
  vouchers: wrapService(VouchersService, 'vouchers'),
  voucherManagement: wrapService(VoucherManagementService, 'voucherManagement'),
  communication: wrapService(CommunicationManagementService, 'communication'),
  storage: wrapService(StorageService, 'storage'),
  support: wrapService(SupportService, 'support'),
  financial: wrapService(FinancialManagementService, 'financial'),
}

// Helper to reset the client (useful for logout)
export function resetApiClient() {
  // Clear any cached data if needed
  OpenAPI.TOKEN = async () => ''
}

// Re-export common types from generated SDK
export type {
  AuthTokensResponse,
  AuthUserResponse,
  BusinessListResponse,
  BusinessResponse,
  CategoryListResponse,
  CategoryResponse,
  RegisterRequest,
  TokenRequest,
  UserProfileResponse,
  VoucherListResponse,
  VoucherResponse,
} from './generated'
