import { DEFAULT_LANGUAGE } from '@pika/environment'
import { type MultilingualContent, SUPPORTED_LANGUAGES } from '@pika/types-core'
import { get, has } from 'lodash-es'

import { ErrorFactory } from '../errors/index.js'

/**
 * Configuration for multilingual field validation and processing
 */
export interface MultilingualFieldConfig {
  /**
   * Whether the field is required in the default language
   */
  requiredDefault?: boolean

  /**
   * Maximum length for text in this field
   */
  maxLength?: number

  /**
   * Minimum length for text in this field
   */
  minLength?: number

  /**
   * Whether to trim whitespace from text values
   */
  trim?: boolean
}

/**
 * Default multilingual field configuration
 */
const DEFAULT_CONFIG: MultilingualFieldConfig = {
  requiredDefault: true,
  maxLength: 1000,
  minLength: 1,
  trim: true,
}

/**
 * Validates that a multilingual text object meets the specified requirements
 *
 * @param value - The multilingual text object to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @param config - Configuration options for validation
 * @returns The validated and normalized multilingual text object
 * @throws ValidationError if validation fails
 */
export function validateMultilingualContent(
  value: unknown,
  fieldName: string,
  config: MultilingualFieldConfig = {},
): MultilingualContent {
  // Combine with default config
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  // Must be an object
  if (!value || typeof value !== 'object') {
    throw ErrorFactory.validationError(
      {
        [fieldName]: [
          `Must be a multilingual object with at least ${DEFAULT_LANGUAGE} text`,
        ],
      },
      {
        source: 'validateMultilingualContent',
        suggestion: `Provide a valid object with language keys, e.g. { "${DEFAULT_LANGUAGE}": "Language text" }`,
      },
    )
  }

  const textObj = value as Record<string, unknown>
  const errors: string[] = []

  // Start with a direct copy of the input object to preserve all languages
  // This will retain all language texts even if they're empty strings
  let result: any = { ...textObj }

  // Check required English text
  if (
    fullConfig.requiredDefault &&
    (!textObj.en || typeof textObj.en !== 'string')
  ) {
    errors.push(`Language text (${DEFAULT_LANGUAGE}) is required`)
  } else if (textObj.en !== undefined) {
    if (typeof textObj.en !== 'string') {
      errors.push(`Language text (${DEFAULT_LANGUAGE}) must be a string`)
    } else {
      // Process English text
      const text = fullConfig.trim ? textObj.en.trim() : textObj.en

      // Check length constraints
      if (
        fullConfig.minLength !== undefined &&
        text.length < fullConfig.minLength
      ) {
        errors.push(
          `Language text (${DEFAULT_LANGUAGE}) must be at least ${fullConfig.minLength} characters`,
        )
      } else if (
        fullConfig.maxLength !== undefined &&
        text.length > fullConfig.maxLength
      ) {
        errors.push(
          `Language text (${DEFAULT_LANGUAGE}) must be at most ${fullConfig.maxLength} characters`,
        )
      } else {
        result.en = text
      }
    }
  }

  // Process other supported languages
  for (const lang of SUPPORTED_LANGUAGES) {
    // Skip English (already processed)
    if (lang === DEFAULT_LANGUAGE) continue

    // Check if the language is present in the input
    if (has(textObj, lang)) {
      // Validate type
      if (typeof get(textObj, lang) !== 'string') {
        errors.push(`${lang.toUpperCase()} text must be a string`)
        continue
      }

      // Apply trimming if configured
      const text = fullConfig.trim
        ? (get(textObj, lang) as string).trim()
        : (get(textObj, lang) as string)

      // Check length constraints only if there is text
      if (
        text.length > 0 &&
        fullConfig.maxLength !== undefined &&
        text.length > fullConfig.maxLength
      ) {
        errors.push(
          `${lang.toUpperCase()} text must be at most ${fullConfig.maxLength} characters`,
        )
        continue
      }

      // Use set from lodash-es to safely assign the property
      result = { ...result, [lang]: text }
    }
    // No else clause - we don't want to override values that were already copied
  }

  // Include any other language keys provided
  Object.keys(textObj).forEach((key) => {
    if (
      !SUPPORTED_LANGUAGES.includes(key) &&
      typeof get(textObj, key) === 'string'
    ) {
      // Use spread to safely assign the property
      result = { ...result, [key]: get(textObj, key) as string }
    }
  })

  // If there are validation errors, throw an error
  if (errors.length > 0) {
    throw ErrorFactory.validationError(
      { [fieldName]: errors },
      {
        source: 'validateMultilingualContent',
        suggestion:
          'Correct the multilingual fields according to the validation rules',
      },
    )
  }

  return result as MultilingualContent
}

/**
 * Ensures that a value is a valid multilingual text object
 * For use with optional fields that might be undefined
 *
 * @param value - The value to ensure is a multilingual text
 * @param fieldName - The name of the field (for error messages)
 * @param config - Configuration for validation
 * @returns A valid multilingual text object or undefined
 */
export function ensureMultilingualContent(
  value: unknown,
  fieldName: string,
  config: MultilingualFieldConfig = { requiredDefault: false },
): MultilingualContent | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  return validateMultilingualContent(value, fieldName, config)
}

/**
 * Get a localized string from a multilingual text object
 *
 * @param text - The multilingual text object
 * @param language - The requested language
 * @param defaultLanguage - Fallback language if requested is not available
 * @returns The localized string or empty string if not found
 */
export function getLocalizedText(
  text: MultilingualContent | undefined | null,
  language: string = DEFAULT_LANGUAGE,
  defaultLanguage: string = DEFAULT_LANGUAGE,
): string {
  if (!text) return ''

  // Try requested language (only if it has content)
  const requestedValue = get(text, language) as string

  if (requestedValue && requestedValue.trim()) return requestedValue

  // Try default language (only if it has content)
  const defaultValue = get(text, defaultLanguage) as string

  if (defaultValue && defaultValue.trim()) return defaultValue

  // Try other languages (only if they have content)
  for (const lang of SUPPORTED_LANGUAGES) {
    const value = get(text, lang) as string

    if (value && value.trim()) return value
  }

  return ''
}
