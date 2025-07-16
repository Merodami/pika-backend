import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber } from '../parsers.js'

// Feature flags
export const ENABLE_REVIEWS = getEnvVariable(
  'ENABLE_REVIEWS',
  parseBoolean,
  true,
)
export const ENABLE_CHAT = getEnvVariable('ENABLE_CHAT', parseBoolean, false)
export const ENABLE_VERIFICATION = getEnvVariable(
  'ENABLE_VERIFICATION',
  parseBoolean,
  true,
)
export const MAINTENANCE_MODE = getEnvVariable(
  'MAINTENANCE_MODE',
  parseBoolean,
  false,
)

// Booking configuration
export const MAX_BOOKING_DAYS_AHEAD = getEnvVariable(
  'MAX_BOOKING_DAYS_AHEAD',
  parseNumber,
  30,
)
export const MIN_BOOKING_HOURS_AHEAD = getEnvVariable(
  'MIN_BOOKING_HOURS_AHEAD',
  parseNumber,
  2,
)
export const SERVICE_HOUR_INCREMENT = getEnvVariable(
  'SERVICE_HOUR_INCREMENT',
  parseNumber,
  30,
)
