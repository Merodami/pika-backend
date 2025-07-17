import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

// Voucher JWT Configuration
export const VOUCHER_JWT_PRIVATE_KEY = getEnvVariable(
  'VOUCHER_JWT_PRIVATE_KEY',
  parseString,
  'placeholder-voucher-private-key', // In production, use proper ECDSA key
)

export const VOUCHER_JWT_PUBLIC_KEY = getEnvVariable(
  'VOUCHER_JWT_PUBLIC_KEY',
  parseString,
  'placeholder-voucher-public-key', // In production, use proper ECDSA key
)

export const VOUCHER_JWT_ALGORITHM = getEnvVariable(
  'VOUCHER_JWT_ALGORITHM',
  parseString,
  'HS256', // Should be ES256 in production with ECDSA keys
)

// Voucher Code Configuration
export const VOUCHER_SHORT_CODE_LENGTH = getEnvVariable(
  'VOUCHER_SHORT_CODE_LENGTH',
  parseNumber,
  8,
)

export const VOUCHER_CODE_ALPHABET = getEnvVariable(
  'VOUCHER_CODE_ALPHABET',
  parseString,
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Base32 without confusing characters
)

// Voucher Business Rules
export const VOUCHER_DEFAULT_MAX_REDEMPTIONS_PER_USER = getEnvVariable(
  'VOUCHER_DEFAULT_MAX_REDEMPTIONS_PER_USER',
  parseNumber,
  1,
)

export const VOUCHER_DEFAULT_EXPIRY_DAYS = getEnvVariable(
  'VOUCHER_DEFAULT_EXPIRY_DAYS',
  parseNumber,
  30,
)

// Voucher Geospatial Configuration
export const VOUCHER_DEFAULT_SEARCH_RADIUS_KM = getEnvVariable(
  'VOUCHER_DEFAULT_SEARCH_RADIUS_KM',
  parseNumber,
  10,
)

export const VOUCHER_MAX_SEARCH_RADIUS_KM = getEnvVariable(
  'VOUCHER_MAX_SEARCH_RADIUS_KM',
  parseNumber,
  50,
)

// Voucher Security
export const VOUCHER_ENABLE_RATE_LIMITING = getEnvVariable(
  'VOUCHER_ENABLE_RATE_LIMITING',
  parseBoolean,
  true,
)

export const VOUCHER_REDEMPTION_RATE_LIMIT = getEnvVariable(
  'VOUCHER_REDEMPTION_RATE_LIMIT',
  parseNumber,
  10, // Max redemptions per minute per user
)

// Voucher Sync Configuration (for offline support)
export const VOUCHER_SYNC_BATCH_SIZE = getEnvVariable(
  'VOUCHER_SYNC_BATCH_SIZE',
  parseNumber,
  100,
)

export const VOUCHER_SYNC_INTERVAL_MS = getEnvVariable(
  'VOUCHER_SYNC_INTERVAL_MS',
  parseNumber,
  300000, // 5 minutes
)
