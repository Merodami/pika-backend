import { ErrorFactory } from '@pika/shared'
import { pick } from 'lodash-es'
import { Pool } from 'pg'

import { PgsqlDocumentMapper } from './PgsqlProjectionRepository.js'
import { PgsqlProjectionRepository } from './PgsqlProjectionRepository.js'

/**
 * Base repository for PostgreSQL projection write operations
 * Provides common CRUD functionality with projections support
 */
export abstract class PgsqlWriteProjectionRepository<
  TDto,
> extends PgsqlProjectionRepository<TDto> {
  /**
   * Constructs a new write projection repository
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
   * Generic method to save a projection record
   * @param dtoData - DTO to save
   * @param mapToDocument - Function to map DTO to document fields
   * @returns ID of the inserted record
   */
  async saveProjection(
    dtoData: TDto,
    mapToDocument: (dto: TDto) => Record<string, any>,
  ): Promise<string> {
    const doc = mapToDocument(dtoData)

    // Convert object keys from camelCase to snake_case
    const dbDoc: Record<string, any> = {}

    for (const [key, value] of Object.entries(doc)) {
      dbDoc[this.camelToSnakeCase(key)] = value
    }

    // Build the query
    const fields = Object.keys(dbDoc)
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ')
    const values = Object.values(dbDoc)

    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')}) 
      VALUES (${placeholders})
      RETURNING id
    `

    const result = await this.pool.query(query, values)

    return result.rows[0].id
  }

  /**
   * Generic method to update specific fields of a projection
   * @param id - Record ID
   * @param changes - Partial changes to apply
   * @param allowedFields - Array of field names that are allowed to be updated
   * @param errorCode - Error code to use if record not found
   * @param errorMessage - Error message to use if record not found
   */
  async updateProjection<T extends TDto>(
    id: string,
    changes: Partial<T>,
    allowedFields: Array<keyof T>,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    // Filter changes to only include allowed fields
    const picked = pick(changes, allowedFields)

    // Add updatedAt field
    const setFields = {
      ...picked,
    }

    if (Object.keys(setFields).length === 0) {
      return
    }

    // Convert object keys from camelCase to snake_case
    const dbFields: Record<string, any> = {}

    for (const [key, value] of Object.entries(setFields)) {
      dbFields[this.camelToSnakeCase(key)] = value
    }

    // Build the SET clause and params
    const setEntries = Object.entries(dbFields)
    const setClauses = setEntries
      .map((entry, idx) => `${entry[0]} = $${idx + 2}`)
      .join(', ')

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE id = $1 AND ${this.getNotDeletedClause()}
    `

    const params = [id, ...setEntries.map((entry) => entry[1])]

    const result = await this.pool.query(query, params)

    if (result.rowCount === 0) {
      throw ErrorFactory.resourceNotFound(this.tableName, id, {
        code: errorCode,
        metadata: {
          message: errorMessage,
        },
      })
    }
  }

  /**
   * Generic method to soft delete a record
   * @param id - Record ID
   * @param errorCode - Error code to use if record not found
   * @param errorMessage - Error message to use if record not found
   */
  async softDelete(
    id: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NOW()
      WHERE id = $1 AND ${this.getNotDeletedClause()}
    `

    const result = await this.pool.query(query, [id])

    if (result.rowCount === 0) {
      throw ErrorFactory.resourceNotFound(this.tableName, id, {
        code: errorCode,
        metadata: {
          message: errorMessage,
        },
      })
    }
  }
}
