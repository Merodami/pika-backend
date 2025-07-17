import { PrismaReadProjectionRepositoryPort } from '@database/port/prisma/PrismaReadProjectionRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'

/**
 * Base class for Prisma-based projection read operations.
 * Subclasses must implement model-specific mapping and filtering.
 */
export abstract class PrismaPgsqlReadProjectionRepository<
  TDomain,
  Q extends {
    page?: number
    limit?: number
    skip?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
  ID,
> implements PrismaReadProjectionRepositoryPort<TDomain, Q, ID>
{
  protected readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Must return the Prisma delegate for the target model (e.g. prisma.category)
   */
  protected abstract model(): {
    count(args: { where: any }): Promise<number>
    findMany(args: {
      where: any
      take: number
      skip: number
      orderBy: any
      include?: any
    }): Promise<any[]>
    findFirst(args: {
      where: any
      select?: any
      include?: any
    }): Promise<any | null>
  }

  /**
   * Build the `where` input for list queries from Q
   */
  protected abstract buildWhere(query: Q): any

  /**
   * Build the `orderBy` input for list queries
   */
  protected abstract buildOrder(query: Q): any

  /**
   * Build the `where` input for getById
   */
  protected abstract buildByIdWhere(id: ID, includeDeleted: boolean): any

  /**
   * Map a raw row into the domain entity
   */
  protected abstract mapRow(row: any): TDomain

  /**
   * Override to include default relations
   */
  protected includeRelations(): any {
    return undefined
  }

  async getAll(query: Q, fields?: string[]): Promise<PaginatedResult<TDomain>> {
    const where = this.buildWhere(query)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const skip = query.skip ?? (page - 1) * limit
    const orderBy = this.buildOrder(query)

    // Build `select` projection from fields, if provided
    const select = fields?.length
      ? Object.fromEntries(fields.map((f) => [f, true]))
      : undefined

    try {
      const [total, rows] = await this.prisma.$transaction(async () => {
        const totalCount = await this.model().count({ where })
        const list = await this.model().findMany({
          where,
          take: limit,
          skip,
          orderBy,
          // If select is provided, use it; otherwise fall back to includeRelations()
          ...(select ? { select } : { include: this.includeRelations() }),
        })

        return [totalCount, list] as const
      })

      const pages = Math.max(1, Math.ceil(total / limit))
      const data = rows.map((row: any) => this.mapRow(row))

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (err: any) {
      logger.error('Error fetching data:', err)

      throw ErrorFactory.databaseError(
        'query',
        'Error executing paginated query',
        err,
        {
          metadata: {
            model: this.constructor.name,
            operation: 'getAll',
          },
        },
      )
    }
  }

  async getById(
    id: ID,
    fields?: string[],
    includeDeleted = false,
  ): Promise<TDomain | null> {
    const where = this.buildByIdWhere(id, includeDeleted)
    const select = fields?.length
      ? fields.reduce((sel, f) => ({ ...sel, [f]: true }), {})
      : undefined

    try {
      const row = await this.model().findFirst({
        where,
        select,
        include: select ? undefined : this.includeRelations(),
      })

      return row ? this.mapRow(row) : null
    } catch (err: any) {
      logger.error('Error fetching by ID:', err)

      throw ErrorFactory.databaseError(
        'query',
        `Error fetching record by ID ${id}`,
        err,
        {
          metadata: {
            model: this.constructor.name,
            operation: 'getById',
            recordId: id,
          },
        },
      )
    }
  }
}
