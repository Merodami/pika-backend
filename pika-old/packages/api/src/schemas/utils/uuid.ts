import { SUPPORTED_LANGUAGES } from '@pika/types-core'
import { Static, Type } from '@sinclair/typebox'

/**
 * Creates a schema for a UUID string.
 * @returns A TypeBox schema for a UUID string.
 */
export const UUIDSchema = Type.String({
  format: 'uuid',
  pattern: '^[0-9a-fA-F-]{36}$',
}) // UUID v4 format

export type UUID = Static<typeof UUIDSchema>

// Helper for creating non-empty string schemas with max length
export const NonEmptyString = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: '^(?!\\s*$).+' })

// Language code schema
export const LanguageCodeSchema = Type.String({
  pattern: '^[a-z]{2}$',
  description: 'ISO 639-1 language code (2 letters)',
  examples: SUPPORTED_LANGUAGES,
})

export type LanguageCode = Static<typeof LanguageCodeSchema>

// Currency code schema
export const CurrencyCodeSchema = Type.String({
  pattern: '^[A-Z]{3}$',
  description: 'ISO 4217 currency code (3 letters)',
  examples: ['PYG', 'USD', 'EUR'],
})

export type CurrencyCode = Static<typeof CurrencyCodeSchema>
