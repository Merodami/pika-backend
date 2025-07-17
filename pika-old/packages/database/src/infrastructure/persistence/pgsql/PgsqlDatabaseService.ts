import { logger } from '@pika/shared'
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg'

/**
 * Metrics collected by PgsqlDatabaseService
 */
export interface PgsqlMetrics {
  queryCount: number
  queryTime: number
  errorCount: number
  retryCount: number
}

/**
 * Configuration options for PgsqlDatabaseService
 */
export interface PgsqlConfig extends PoolConfig {
  /**
   * Hostname or IP address of the PostgreSQL server
   */
  host: string
  /**
   * Port number of the PostgreSQL server
   */
  port: number
  /**
   * Username for the PostgreSQL server
   */
  user: string
  /**
   * Password for the PostgreSQL server
   */
  password: string
  /**
   * Maximum number of retry attempts for establishing connection
   * @default 5
   */
  maxRetries?: number
  /**
   * Delay between retries in milliseconds
   * @default 2000
   */
  retryDelayMs?: number
  /**
   * Database name
   */
  database: string
  /**
   * SSL configuration
   * @default false
   */
  ssl?: boolean
  /**
   * Maximum number of connections in the pool
   * @default 20
   */
  maxConnections?: number
  /**
   * Idle timeout in milliseconds
   * @default 30000
   */
  idleTimeoutMillis?: number
  /**
   * Connection timeout in milliseconds
   * @default 2000
   */
  connectionTimeoutMillis?: number
}

/**
 * PgsqlDatabaseService encapsulates low‑level PostgreSQL connection management.
 *
 * Responsibilities:
 * - Establishing and managing a connection pool.
 * - Retry logic for transient connection failures.
 * - Executing parameterized queries.
 * - Tracking performance metrics.
 */
export class PgsqlDatabaseService {
  private pool: Pool
  private metrics: PgsqlMetrics = {
    queryCount: 0,
    queryTime: 0,
    errorCount: 0,
    retryCount: 0,
  }

  constructor(private config: PgsqlConfig) {
    this.pool = new Pool(config)
  }

  /**
   * Initialize the connection pool, with retry logic.
   */
  async connect(): Promise<void> {
    const maxRetries = this.config.maxRetries ?? 5
    const delayMs = this.config.retryDelayMs ?? 2000

    let attempt = 0

    while (true) {
      try {
        const client = await this.pool.connect()

        client.release()
        logger.info('PostgreSQL connection established')

        return
      } catch (err: any) {
        attempt++
        this.metrics.retryCount++
        logger.error(
          `Postgres connection attempt ${attempt} failed: ${err.message}`,
        )

        if (attempt >= maxRetries) {
          logger.error(
            'Postgres: maximum retry attempts reached, throwing error',
          )
          throw err
        }

        logger.info(`Retrying Postgres connection in ${delayMs}ms`)
        await new Promise((res) => setTimeout(res, delayMs))
      }
    }
  }

  /**
   * Gracefully shuts down the connection pool.
   */
  async close(): Promise<void> {
    await this.pool.end()
    logger.info('PostgreSQL pool has been closed')
  }

  /**
   * Execute a parameterized SQL query.
   * Tracks metrics for performance monitoring.
   *
   * @param text SQL query text
   * @param params Optional query parameters
   */
  async query<T = any>(
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now()

    try {
      const result: QueryResult = await this.pool.query(text, params)

      this.metrics.queryCount++
      this.metrics.queryTime += Date.now() - start

      return { rows: result.rows, rowCount: result.rowCount ?? 0 }
    } catch (err: any) {
      this.metrics.errorCount++
      logger.error(
        `Postgres query error: ${err.message}\nQuery: ${text}\nParams: ${JSON.stringify(params)}`,
      )
      throw err
    }
  }

  /**
   * Get a raw client for advanced operations (transactions, cursors, etc.)
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect()
  }

  /**
   * Retrieve collected metrics
   */
  getMetrics(): PgsqlMetrics {
    return { ...this.metrics }
  }

  /**
   * Expose the underlying pool (use sparingly)
   */
  getPool(): Pool {
    return this.pool
  }
}
