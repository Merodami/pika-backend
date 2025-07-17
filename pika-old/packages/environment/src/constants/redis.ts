import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber, parseString } from '../parsers.js'

export const REDIS_HOST = getEnvVariable('REDIS_HOST', parseString, 'localhost')

export const REDIS_PORT = getEnvVariable('REDIS_PORT', parseNumber, 6380)

export const REDIS_PASSWORD = getEnvVariable('REDIS_PASSWORD', parseString, '')

export const REDIS_PREFIX = getEnvVariable(
  'REDIS_PREFIX',
  String,
  'marketplace:',
)

export const REDIS_DEFAULT_TTL = getEnvVariable(
  'REDIS_DEFAULT_TTL',
  Number,
  3600,
)

export const REDIS_RETRY_DELAY = getEnvVariable(
  'REDIS_RETRY_DELAY',
  parseNumber,
  50,
)

export const REDIS_MAX_RETRY_DELAY = getEnvVariable(
  'REDIS_MAX_RETRY_DELAY',
  Number,
  2000,
)

export const CACHE_DISABLED = getEnvVariable(
  'CACHE_DISABLED',
  (v: string) => v === 'true',
  false,
)
