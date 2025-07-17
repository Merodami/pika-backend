import { ErrorFactory, logger } from '@pika/shared'
import { PaginatedResult } from '@pika/types-core'
import { Pool } from 'pg'

import { PgsqlDocumentMapper } from './PgsqlProjectionRepository.js'
import { PgsqlProjectionRepository } from './PgsqlProjectionRepository.js'

/**
 * Base repository for PostgreSQL projection read operations
 * Provides common query functionality with projections support
 */
export abstract class PgsqlReadProjectionRepository<
  TDto,
> extends PgsqlProjectionRepository<TDto> {
  /**
   * Constructs a new read projection repository
   * @param pool - PostgreSQL connection pool
   * @param tableName - Table name for this projection
   * @param mapToDto - Function to map database rows to DTOs
   */
  constructor(
    /**
     * @param pool - PostgreSQL connection pool
     */
    protected readonly pool: Pool,
    protected readonly tableName: string,
    protected readonly mapToDto: PgsqlDocumentMapper<TDto>,
  ) {
    super(pool, tableName, mapToDto)
  }

  /**
   * Find a single record by where clause
   * @param whereClause - SQL WHERE clause (without the 'WHERE' keyword)
   * @param params - Query parameters
   * @param fields - Optional projection fields
   * @param errorContext - Context for error messages
   * @returns Mapped DTO or null if not found
   */
  async findOne(
    whereClause: string,
    params: any[],
    fields?: string[] | string,
    errorContext?: string,
    includeDeleted?: boolean,
  ): Promise<TDto | null> {
    // Handle string array or potentially string with comma separated values
    const projectionFields = Array.isArray(fields)
      ? fields
      : typeof fields === 'string'
        ? fields.split(',')
        : undefined

    const projection = this.buildProjectionClause(projectionFields)
    const completeWhereClause = this.buildCompleteWhereClause(
      whereClause,
      includeDeleted,
    )

    const query = `
      SELECT ${projection}
      FROM ${this.tableName}
      ${completeWhereClause}
      LIMIT 1
    `

    try {
      const result = await this.pool.query(query, params)

      if (result.rowCount === 0) {
        return null
      }

      const camelCaseRow = this.snakeToCamelCaseKeys(result.rows[0])

      return this.mapToDto(camelCaseRow)
    } catch (err) {
      const context = errorContext || 'document'

      logger.error(`Invalid ${context}:`, err)

      throw ErrorFactory.databaseError(
        'query',
        `Invalid ${context} data`,
        err,
        {
          metadata: {
            tableName: this.tableName,
            operation: 'findOne',
          },
        },
      )
    }
  }

  /**
   * Find multiple records
   * @param whereClause - SQL WHERE clause (without the 'WHERE' keyword)
   * @param params - Query parameters
   * @param options - Query options (pagination, sorting, projection)
   * @returns Array of mapped DTOs
   */
  async findMany(
    whereClause: string,
    params: any[],
    options: {
      skip?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      fields?: string[] | string
    } = {},
  ): Promise<TDto[]> {
    const { skip = 0, limit = 10, sortBy, sortOrder, fields } = options

    // Handle string array or potentially string with comma separated values
    const projectionFields = Array.isArray(fields)
      ? fields
      : typeof fields === 'string'
        ? fields.split(',')
        : undefined

    const projection = this.buildProjectionClause(projectionFields)
    const completeWhereClause = this.buildCompleteWhereClause(whereClause)

    // If sortBy is provided, convert from camelCase to snake_case
    const orderByClause = sortBy
      ? `ORDER BY ${this.camelToSnakeCase(sortBy)} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`
      : ''

    const query = `
      SELECT ${projection}
      FROM ${this.tableName}
      ${completeWhereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${skip}
    `

    const result = await this.pool.query(query, params)

    // Convert each row's keys from snake_case to camelCase and map to DTO
    return result.rows.map((row) => {
      const camelCaseRow = this.snakeToCamelCaseKeys(row)

      return this.mapToDto(camelCaseRow)
    })
  }

  /**
   * Count records matching a where clause
   * @param whereClause - SQL WHERE clause (without the 'WHERE' keyword)
   * @param params - Query parameters
   * @returns Count of matching records
   */
  async count(whereClause: string, params: any[]): Promise<number> {
    const completeWhereClause = this.buildCompleteWhereClause(whereClause)

    const query = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      ${completeWhereClause}
    `

    const result = await this.pool.query(query, params)

    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Executes a paginated query with comprehensive metadata
   * @param whereClause - SQL WHERE clause (without the 'WHERE' keyword)
   * @param params - Query parameters
   * @param queryParams - Query parameters including pagination and sorting
   * @param fields - Optional fields to include in the projection
   * @returns Paginated result with data and metadata
   */
  async executePaginatedQuery<
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
  ): Promise<PaginatedResult<TDto>> {
    // Count total before pagination
    const total = await this.count(whereClause, params)

    // Extract pagination parameters with defaults
    const limit = queryParams.limit || 10
    const page = queryParams.page || 1
    const skip =
      queryParams.skip !== undefined ? queryParams.skip : (page - 1) * limit

    // Calculate derived pagination values
    const pages = Math.ceil(total / limit)
    const currentPage =
      queryParams.skip !== undefined ? Math.floor(skip / limit) + 1 : page

    // Execute query with pagination, sorting and projection
    const data = await this.findMany(whereClause, params, {
      skip,
      limit,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
      fields,
    })

    // Return paginated result
    return {
      data,
      pagination: {
        total,
        page: currentPage,
        limit,
        pages,
        has_next: currentPage < pages,
        has_prev: currentPage > 1,
      },
    }
  }
}
