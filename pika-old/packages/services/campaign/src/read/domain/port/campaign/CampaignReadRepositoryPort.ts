import { CampaignSearchQuery } from '@campaign-read/application/use_cases/queries/CampaignSearchQuery.js'
import { GetCampaignQuery } from '@campaign-read/application/use_cases/queries/GetCampaignQuery.js'
import { Campaign } from '@campaign-read/domain/entities/Campaign.js'
import type { PaginatedResult } from '@pika/types-core'

/**
 * CampaignReadRepositoryPort defines the contract for campaign data access in the read model.
 * Implementations of this interface handle retrieval operations for campaigns.
 */
export interface CampaignReadRepositoryPort {
  /**
   * Retrieve all campaigns matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated campaign results
   */
  getAllCampaigns(
    query: CampaignSearchQuery,
  ): Promise<PaginatedResult<Campaign>>

  /**
   * Retrieve a single campaign by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the campaign or null if not found
   */
  getCampaignById(query: GetCampaignQuery): Promise<Campaign | null>
}
