import { camelCase, get, set, snakeCase } from 'lodash-es'
import { Pool } from 'pg'

/**
 * Type definition for mapping database records to DTOs
 */
export type PgsqlDocumentMapper<TDto> = (row: Record<string, any>) => TDto

/**
 * Base repository for PostgreSQL projection operations
 */
export abstract class PgsqlProjectionRepository<TDto> {
  /**
   * Constructs a new base projection repository
   * @param pool - PostgreSQL connection pool
   * @param tableName - Table name for this projection
   * @param mapToDto - Function to map database rows to DTOs
   */
  constructor(
    protected readonly pool: Pool,
    protected readonly tableName: string,
    protected readonly mapToDto: PgsqlDocumentMapper<TDto>,
  ) {}

  /**
   * Build a soft deletion WHERE clause
   * @returns SQL WHERE clause to exclude soft-deleted records
   */
  protected getNotDeletedClause(): string {
    return '(deleted_at IS NULL)'
  }

  /**
   * Combines entity filter with soft deletion filter
   * @param whereClause - Entity-specific WHERE clause
   * @returns Combined WHERE clause
   */
  protected buildCompleteWhereClause(
    whereClause: string,
    includeDeleted?: boolean,
  ): string {
    if (!whereClause && !includeDeleted) {
      return `WHERE ${this.getNotDeletedClause()}`
    }

    if (!whereClause && includeDeleted) {
      return ''
    }

    if (includeDeleted) {
      return `WHERE ${whereClause}`
    }

    return `WHERE ${this.getNotDeletedClause()} AND (${whereClause})`
  }

  /**
   * Builds a projection clause for SQL queries
   * @param fields - Array of field names to include
   * @returns SQL projection clause
   */
  protected buildProjectionClause(fields?: string[]): string {
    if (!fields || fields.length === 0) {
      return '*'
    }

    // Convert camelCase to snake_case and join fields
    return fields.map((field) => this.camelToSnakeCase(field)).join(', ')
  }

  /**
   * Converts camelCase string to snake_case
   * @param str - String to convert
   * @returns Converted string
   */
  protected camelToSnakeCase(str: string): string {
    return snakeCase(str)
  }

  /**
   * Converts snake_case object keys to camelCase
   * @param obj - Object with snake_case keys
   * @returns Object with camelCase keys
   */
  protected snakeToCamelCaseKeys(
    obj: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = camelCase(key)

        set(result, camelKey, get(obj, key))
      }
    }

    return result
  }
}
