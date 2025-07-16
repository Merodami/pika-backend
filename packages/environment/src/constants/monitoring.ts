import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

// Sentry configuration
export const SENTRY_DSN = getEnvVariable('SENTRY_DSN', parseString, '')

// Metrics configuration
export const ENABLE_METRICS = getEnvVariable(
  'ENABLE_METRICS',
  parseBoolean,
  false,
)
export const METRICS_PORT = getEnvVariable('METRICS_PORT', parseNumber, 10090)

// Debug mode
export const DEBUG = getEnvVariable('DEBUG', parseBoolean, false)

// DataDog configuration
export const DD_API_KEY = getEnvVariable('DD_API_KEY', parseString, '')
