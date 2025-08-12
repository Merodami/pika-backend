/**
 * Field length constraints used across all schemas
 * Single source of truth for all string length validations
 */
export const FIELD_LENGTH = {
  // Name fields
  NAME_MIN: 1,
  NAME_MAX: 100,
  NAME_LONG_MAX: 200,
  NAME_EXTRA_LONG_MAX: 250,
  FIRST_NAME_MAX: 50,
  LAST_NAME_MAX: 50,
  DISPLAY_NAME_MAX: 100,

  // Description fields
  DESCRIPTION_SHORT_MAX: 255,
  DESCRIPTION_MEDIUM_MAX: 500,
  DESCRIPTION_LONG_MAX: 1000,
  DESCRIPTION_EXTRA_LONG_MAX: 2000,
  NOTES_MAX: 500,

  // Identifier fields
  SLUG_MAX: 255,
  CODE_MIN: 1,
  CODE_MAX: 50,
  CODE_SHORT_MIN: 3,
  CODE_SHORT_MAX: 20,
  TOKEN_MIN: 1,
  TOKEN_MAX: 255,

  // Credential fields
  PASSWORD_MIN: 8,
  EMAIL_MIN: 1,
  EMAIL_MAX: 255,

  // Misc fields
  ICON_MAX: 255,
  TRANSLATION_KEY_MAX: 255,
  CURRENCY_LENGTH: 3,
  VERIFICATION_CODE_LENGTH: 6,
  PHONE_MIN: 10,
  PHONE_MAX: 15,
  URL_MAX: 2048,

  // File/Storage
  FILENAME_MAX: 255,
  MIME_TYPE_MAX: 127,
  FILE_EXTENSION_MAX: 10,

  // Address fields
  ADDRESS_LINE_MAX: 255,
  CITY_MAX: 100,
  STATE_MAX: 50,
  POSTAL_CODE_MAX: 20,
  COUNTRY_CODE_LENGTH: 2,
} as const

/**
 * Numeric constraints for validations
 */
export const NUMERIC_CONSTRAINTS = {
  // Ratings
  RATING_MIN: 0,
  RATING_MAX: 5,
  RATING_STEP: 0.5,

  // Money/Price
  PRICE_MIN: 0,
  PRICE_MAX: 999999.99,
  DISCOUNT_MIN: 0,
  DISCOUNT_MAX: 100,

  // Quantities
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 9999,

  // Percentages
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,

  // Pagination
  PAGE_MIN: 1,
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 100,
  PAGE_SIZE_DEFAULT: 20,

  // Time (in seconds)
  SESSION_TIMEOUT: 3600,
  TOKEN_EXPIRY_DEFAULT: 86400,
  VERIFICATION_EXPIRY: 3600,
} as const

/**
 * Regular expressions for common validations
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const

// Type exports for better type safety
export type FieldLength = typeof FIELD_LENGTH
export type NumericConstraints = typeof NUMERIC_CONSTRAINTS
export type ValidationPatterns = typeof VALIDATION_PATTERNS
