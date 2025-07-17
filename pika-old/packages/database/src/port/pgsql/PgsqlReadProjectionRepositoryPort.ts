import type { PaginatedResult } from '@pika/types-core'

export interface PgsqlReadProjectionRepositoryPort<TDto> {
  findOne(
    whereClause: string,
    params: any[],
    fields?: string[] | string,
    errorContext?: string,
    includeDeleted?: boolean,
  ): Promise<TDto | null>

  findMany(
    whereClause: string,
    params: any[],
    options?: {
      skip?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      fields?: string[] | string
    },
  ): Promise<TDto[]>

  count(whereClause: string, params: any[]): Promise<number>

  executePaginatedQuery<
    T extends {
      page?: number
      limit?: number
      skip?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    },
  >(
    whereClause: string,
    params: any[],
    queryParams: T,
    fields?: string[] | string,
  ): Promise<PaginatedResult<TDto>>
}
