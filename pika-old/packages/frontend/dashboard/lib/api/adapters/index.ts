// Re-export all adapters from a single location
export { adminAdapter as admin } from '../admin-adapter'
export { providerAdapter as provider } from '../provider-adapter'
export { voucherAdapter as voucher } from '../voucher-adapter'

// Export the raw SDK API client for direct access when needed
export { api as sdk } from '../client'

// Re-export commonly used types
export type {
  AuthResponse,
  Category,
  CategoryListResponse,
  Login,
  ProviderProfile,
  Review,
  UserProfile,
  UserRegistration,
  Voucher,
  VoucherListResponse,
} from '@pika/sdk'
