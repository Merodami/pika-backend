import { SUPPORTED_LANGUAGES } from '@pika/environment'
import { type MultilingualContent } from '@pika/types-core'
import { get, set } from 'lodash-es'

/**
 * Normalizes multilingual content by ensuring all supported languages are present.
 * Missing languages are filled with empty strings.
 *
 * This is used at the repository layer before saving to database to ensure
 * data consistency - all records have the same structure.
 *
 * @param content - The multilingual content to normalize
 * @returns Normalized content with all supported languages
 */
export function normalizeMultilingualContent(
  content: Partial<MultilingualContent> | undefined | null,
): MultilingualContent {
  // Start with empty strings for all supported languages
  const normalized: MultilingualContent = {
    en: '',
    es: '',
    gn: '',
  }

  // If no content provided, return all empty strings
  if (!content) {
    return normalized
  }

  // Fill in provided values
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const value = get(content, lang)

    if (value !== undefined && value !== null) {
      set(normalized, lang, value)
    }
  })

  return normalized
}

/**
 * Normalizes multiple multilingual fields in an object
 *
 * @param data - Object containing multilingual fields
 * @param fields - Array of field names to normalize
 * @returns Object with normalized multilingual fields
 */
export function normalizeMultilingualFields<T extends Record<string, any>>(
  data: T,
  fields: Array<keyof T>,
): T {
  const normalized = { ...data }

  fields.forEach((field) => {
    const fieldValue = get(data, field as string)

    if (fieldValue !== undefined) {
      set(normalized, field as string, normalizeMultilingualContent(fieldValue))
    }
  })

  return normalized
}
