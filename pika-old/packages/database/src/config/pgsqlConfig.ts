import {
  PG_CONNECTION_TIMEOUT,
  PG_DATABASE,
  PG_HOST,
  PG_IDLE_TIMEOUT,
  PG_MAX_CONNECTIONS,
  PG_PASSWORD,
  PG_PORT,
  PG_SSL,
  PG_USER,
} from '@pika/environment'

export const pgsqlConfig = {
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
  ssl: PG_SSL,
  maxConnections: PG_MAX_CONNECTIONS,
  idleTimeoutMillis: PG_IDLE_TIMEOUT,
  connectionTimeoutMillis: PG_CONNECTION_TIMEOUT,
}
