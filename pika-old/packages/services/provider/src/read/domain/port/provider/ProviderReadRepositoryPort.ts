import type { PaginatedResult } from '@pika/types-core'
import { GetProviderQuery } from '@provider-read/application/use_cases/queries/GetProviderQuery.js'
import { ProviderSearchQuery } from '@provider-read/application/use_cases/queries/ProviderSearchQuery.js'
import { Provider } from '@provider-read/domain/entities/Provider.js'

/**
 * ProviderReadRepositoryPort defines the contract for provider data access in the read model.
 * Implementations of this interface handle retrieval operations for providers.
 * Following Admin pattern - uses local domain entity, not SDK
 */
export interface ProviderReadRepositoryPort {
  /**
   * Retrieve all providers matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated provider results
   */
  getAllProviders(
    query: ProviderSearchQuery,
  ): Promise<PaginatedResult<Provider>>

  /**
   * Retrieve a single provider by its unique identifier
   *
   * @param query - Query parameters containing ID
   * @returns Promise with the provider or null if not found
   */
  getProviderById(query: GetProviderQuery): Promise<Provider | null>

  /**
   * Retrieve a provider by user ID
   *
   * @param userId - The user ID to search for
   * @returns Promise with the provider or null if not found
   */
  getProviderByUserId(userId: string): Promise<Provider | null>
}
