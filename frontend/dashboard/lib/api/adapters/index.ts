// Re-export all adapters from a single location
export { adminAdapter as admin } from '../adminAdapter'
export { businessAdapter as business } from '../businessAdapter'
// export { voucherAdapter as voucher } from '../voucherAdapter' // Unused: no imports found in codebase

// Export the raw SDK API client for direct access when needed
export { api as sdk } from '../client'

// Re-export commonly used types from generated SDK
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
} from '../generated'
