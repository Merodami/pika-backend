import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

export const SENTRY_DSN = getEnvVariable('SENTRY_DSN', String)
export const ENABLE_METRICS = getEnvVariable(
  'ENABLE_METRICS',
  (v: string) => v === 'true',
  false,
)
export const METRICS_PORT = getEnvVariable('METRICS_PORT', parseNumber, 9090)
export const DEBUG = getEnvVariable('DEBUG', parseBoolean, false)
export const DD_API_KEY = getEnvVariable('DD_API_KEY', parseString, '')
