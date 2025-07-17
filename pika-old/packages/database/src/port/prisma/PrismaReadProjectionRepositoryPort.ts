import type { PaginatedResult } from '@pika/types-core'

/**
 * Generic interface for Prisma-based projection read repositories.
 * @template TDomain  The domain entity type
 * @template Q        The search/query parameters type (must include pagination/sorting fields)
 * @template ID      The identifier type for getById
 */
export interface PrismaReadProjectionRepositoryPort<
  TDomain,
  Q extends {
    page?: number
    limit?: number
    skip?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
  ID,
> {
  /**
   * Retrieves a paginated list of domains based on the given query.
   */
  getAll(query: Q, fields?: string[]): Promise<PaginatedResult<TDomain>>

  /**
   * Retrieves a single domain entity by its ID.
   */
  getById(
    id: ID,
    fields?: string[],
    includeDeleted?: boolean,
  ): Promise<TDomain | null>
}
