// packages/database/src/infrastructure/persistence/pgsql/PgsqlRepository.ts
import type { PgsqlRepositoryPort } from '@database/port/pgsql/PgsqlRepositoryPort.js'
import { Pool } from 'pg'

export abstract class PgsqlRepository<T> implements PgsqlRepositoryPort<T> {
  constructor(protected readonly pool: Pool) {}
}
