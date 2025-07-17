import { CampaignStatus, MultilingualContent } from '@pika/types-core'

// Campaign DTOs for write operations

export type CampaignCreateDTO = {
  name: MultilingualContent
  description: MultilingualContent
  startDate: Date
  endDate: Date
  budget: number
  status?: CampaignStatus
  providerId: string
  active?: boolean
  targetAudience?: MultilingualContent | null
  objectives?: MultilingualContent | null
}

export type CampaignUpdateDTO = {
  name?: MultilingualContent
  description?: MultilingualContent
  startDate?: Date
  endDate?: Date
  budget?: number
  status?: CampaignStatus
  active?: boolean
  targetAudience?: MultilingualContent | null
  objectives?: MultilingualContent | null
}
