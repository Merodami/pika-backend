// Re-export all adapters from a single location
export { adminAdapter as admin } from '../admin-adapter'
export { businessAdapter as business } from '../business-adapter'
export { voucherAdapter as voucher } from '../voucher-adapter'

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
