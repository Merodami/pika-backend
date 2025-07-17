import { PgsqlMetrics } from '@database/infrastructure/index.js'
import { Pool, PoolClient } from 'pg'

/**
 * PostgreSQL database service port interface
 */
export interface PgsqlDatabaseServicePort {
  /**
   * Connect to the database
   */
  connect(): Promise<void>

  /**
   * Close all connections and shut down the pool
   */
  close(): Promise<void>

  /**
   * Query the database
   */
  query<T>(
    sql: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }>

  /**
   * Acquire a client from the pool
   */
  getClient(): Promise<PoolClient>

  /**
   * Get the metrics
   */
  getMetrics(): PgsqlMetrics

  /**
   * Get the connection pool
   */
  getPool(): Pool
}
