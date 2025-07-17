import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

// Provider business rule constants
export const PROVIDER_HIGH_RATING_THRESHOLD = getEnvVariable(
  'PROVIDER_HIGH_RATING_THRESHOLD',
  parseNumber,
  4.0,
)

export const PROVIDER_NEW_DAYS_THRESHOLD = getEnvVariable(
  'PROVIDER_NEW_DAYS_THRESHOLD',
  parseNumber,
  30,
)

// Provider rating constraints
export const PROVIDER_MIN_RATING = 0
export const PROVIDER_MAX_RATING = 5

// File upload limits for provider-related files
export const PROVIDER_MAX_FILE_SIZE = getEnvVariable(
  'PROVIDER_MAX_FILE_SIZE',
  parseNumber,
  5 * 1024 * 1024, // 5MB
)
