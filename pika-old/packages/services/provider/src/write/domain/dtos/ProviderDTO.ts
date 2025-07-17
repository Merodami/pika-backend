// Provider DTOs for write operations

import type { MultilingualContent } from '@pika/types-core'

export type ProviderCreateDTO = {
  businessName: MultilingualContent
  businessDescription: MultilingualContent
  categoryId: string
  verified?: boolean
  active?: boolean
  avgRating?: number
}

export type ProviderUpdateDTO = {
  businessName?: MultilingualContent
  businessDescription?: MultilingualContent
  categoryId?: string
  verified?: boolean
  active?: boolean
  avgRating?: number
}
