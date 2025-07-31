import { mapValues, isFunction } from 'lodash-es'
import { toast } from 'sonner'

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

// Configure OpenAPI client to use Next.js API routes as proxy
// This follows the BFF (Backend for Frontend) pattern for security
OpenAPI.BASE = '/api/proxy'
OpenAPI.WITH_CREDENTIALS = true

// No token management needed - handled server-side via httpOnly cookies
OpenAPI.TOKEN = async () => ''

// Dynamic headers resolver
OpenAPI.HEADERS = async () => ({
  'x-correlation-id': crypto.randomUUID(),
})

// Token refresh is handled server-side in the API route handler
// No client-side token management needed with BFF pattern

// API error type
interface ApiError {
  status?: number
  body?: {
    message?: string
  }
  message?: string
}

// Handle API errors with toast notifications
function handleApiError(error: unknown): never {
  const apiError = error as ApiError
  if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
    const message =
      apiError?.body?.message || apiError?.message || 'Request failed'

    toast.error(message)
  } else if (apiError?.status && apiError.status >= 500) {
    toast.error('Server error. Please try again later.')
  } else if (apiError?.message) {
    toast.error(apiError.message)
  }
  throw error
}

// Create wrapper for 401 handling
function wrapWithAuth<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/login'
        throw error
      }
      handleApiError(error)
    }
  }) as T
}

// Wrap service methods with auth handling
function wrapService<T>(service: T): T {
  // Use lodash mapValues to transform object properties
  return mapValues(service as object, (value) => {
    if (isFunction(value)) {
      // Wrap functions with auth handling
      // Type assertion needed because lodash isFunction doesn't narrow types
      const fn = value as (...args: unknown[]) => Promise<unknown>
      return wrapWithAuth(fn.bind(service))
    }
    return value
  }) as T
}

// Create API client interface
export const api = {
  auth: wrapService(AuthenticationService),
  categories: wrapService(CategoriesService),
  categoryManagement: wrapService(CategoryManagementService),
  businesses: wrapService(MyBusinessService),
  businessManagement: wrapService(BusinessManagementService),
  users: wrapService(UsersService),
  userManagement: wrapService(UserManagementService),
  vouchers: wrapService(VouchersService),
  voucherManagement: wrapService(VoucherManagementService),
  communication: wrapService(CommunicationManagementService),
  storage: wrapService(StorageService),
  support: wrapService(SupportService),
  financial: wrapService(FinancialManagementService),
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
