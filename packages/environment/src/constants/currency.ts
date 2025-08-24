import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

/**
 * Default currency for the platform
 * VoucherBook uses Paraguayan Guaraní as default
 */
export const DEFAULT_CURRENCY = getEnvVariable(
  'DEFAULT_CURRENCY',
  parseString,
  'PYG',
)

/**
 * Currency codes supported by the platform
 */
export const SUPPORTED_CURRENCIES = ['PYG', 'USD', 'EUR'] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

/**
 * Currency symbols for display
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  PYG: 'Gs.',
  USD: '$',
  EUR: '€',
}
