import { MultilingualText } from '@provider-read/domain/entities/Provider.js'

/**
 * Data Transfer Object for Providers
 * Used for transferring provider data between application layers
 */
export interface ProviderDTO {
  id: string
  userId: string
  businessName: MultilingualText
  businessDescription: MultilingualText
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
  // Optional localized fields used for API responses
  localizedBusinessName?: string
  localizedBusinessDescription?: string
}

/**
 * Provider list response structure
 * Includes pagination metadata
 */
export interface ProviderListResponseDTO {
  data: ProviderDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}
