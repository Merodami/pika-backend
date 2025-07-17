import {
  type CampaignCreateDTO,
  type CampaignUpdateDTO,
} from '@campaign-write/domain/dtos/CampaignDTO.js'
import { type Campaign } from '@campaign-write/domain/entities/Campaign.js'

export interface CampaignWriteRepositoryPort {
  createCampaign(dto: CampaignCreateDTO): Promise<Campaign>
  updateCampaign(id: string, dto: CampaignUpdateDTO): Promise<Campaign>
  deleteCampaign(id: string): Promise<void>
  findById(id: string): Promise<Campaign | null>
}
