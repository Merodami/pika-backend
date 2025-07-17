import { SUPPORTED_LANGUAGES } from '@pika/environment'
import { type MultilingualContent } from '@pika/types-core'
import { get, isObject, omit, pickBy, set } from 'lodash-es'

import {
  ensureMultilingualContent,
  type MultilingualFieldConfig,
  validateMultilingualContent,
} from './multilingualValidation.js'

// Re-export types for convenience
export type { MultilingualFieldConfig }

/**
 * Comprehensive multilingual operations utility
 * Provides a complete set of functions for working with multilingual content
 * including validation, merging, transformation, and comparison.
 */

/**
 * Options for multilingual merge operations
 */
export interface MergeOptions {
  /**
   * Whether to validate the result after merging
   */
  validate?: boolean

  /**
   * Validation configuration to use if validate is true
   */
  validationConfig?: MultilingualFieldConfig

  /**
   * Whether to remove empty string values after merge
   */
  removeEmpty?: boolean

  /**
   * Whether to preserve null/undefined values from update
   */
  preserveNull?: boolean
}

/**
 * Intelligently merges multilingual content during update operations
 * Preserves existing languages while applying updates
 *
 * @param existing - Current multilingual content (from database)
 * @param update - Partial update to apply
 * @param options - Merge options
 * @returns Merged multilingual content
 *
 * @example
 * const existing = { en: "Hello", es: "Hola", gn: "Maitei" }
 * const update = { en: "Hi", pt: "Oi" }
 * const result = mergeMultilingualContent(existing, update)
 * // Result: { en: "Hi", es: "Hola", gn: "Maitei", pt: "Oi" }
 */
export function mergeMultilingualContent(
  existing: MultilingualContent | null | undefined,
  update: Partial<MultilingualContent> | null | undefined,
  options: MergeOptions = {},
): MultilingualContent {
  // Handle null/undefined cases
  if (!update || Object.keys(update).length === 0) {
    return existing || { en: '', es: '', gn: '' }
  }

  if (!existing) {
    // Start with update and ensure English exists
    const base: MultilingualContent = {
      en: '',
      ...update,
    } as MultilingualContent

    // Clean if requested
    if (options.removeEmpty) {
      return cleanMultilingualContent(base, true)
    }

    // Validate if requested
    if (options.validate) {
      return validateMultilingualContent(
        base,
        'field',
        options.validationConfig,
      )
    }

    return base
  }

  // Perform the merge
  let merged: MultilingualContent = { ...existing }

  // Apply updates
  Object.keys(update).forEach((lang) => {
    const value = get(update, lang)

    if (value === null) {
      // Handle null based on options
      if (options.preserveNull) {
        merged = omit(merged, lang) as MultilingualContent
      }
      // Otherwise ignore null updates
    } else if (value !== undefined) {
      // Only update if value is defined (not undefined)
      set(merged, lang, value)
    }
    // Ignore undefined values completely
  })

  // Ensure English is always present
  if (!merged.en) {
    merged.en = existing.en || ''
  }

  // Clean if requested
  if (options.removeEmpty) {
    merged = cleanMultilingualContent(merged, true)
  }

  // Validate if requested
  if (options.validate) {
    return validateMultilingualContent(
      merged,
      'field',
      options.validationConfig,
    )
  }

  return merged
}

/**
 * Creates a partial update object for multilingual content
 * Only includes languages that have actually changed
 *
 * @param current - Current multilingual content
 * @param desired - Desired multilingual content
 * @returns Partial update object with only changed languages
 */
export function createMultilingualUpdate(
  current: MultilingualContent,
  desired: MultilingualContent,
): Partial<MultilingualContent> | null {
  const changes: Partial<MultilingualContent> = {}

  let hasChanges = false

  // Check all languages in desired
  Object.keys(desired).forEach((lang) => {
    if (get(current, lang) !== get(desired, lang)) {
      set(changes, lang, get(desired, lang))
      hasChanges = true
    }
  })

  // Check for removed languages
  Object.keys(current).forEach((lang) => {
    if (!(lang in desired)) {
      set(changes, lang, undefined)
      hasChanges = true
    }
  })

  return hasChanges ? changes : null
}

/**
 * Removes empty or whitespace-only values from multilingual content
 *
 * @param content - Multilingual content to clean
 * @param preserveEnglish - Whether to always keep English even if empty
 * @returns Cleaned multilingual content
 */
export function cleanMultilingualContent(
  content: MultilingualContent,
  preserveEnglish: boolean = true,
): MultilingualContent {
  const cleaned = pickBy(content, (value, key) => {
    if (key === 'en' && preserveEnglish) {
      return true
    }

    return value && value.trim().length > 0
  }) as MultilingualContent

  // Ensure English exists if required
  if (preserveEnglish && !cleaned.en) {
    cleaned.en = ''
  }

  return cleaned
}

/**
 * Checks if multilingual content has any non-empty values
 *
 * @param content - Multilingual content to check
 * @returns True if at least one language has content
 */
export function hasMultilingualContent(
  content: MultilingualContent | null | undefined,
): boolean {
  if (!content) return false

  return Object.values(content).some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
}

/**
 * Gets all available languages in multilingual content
 *
 * @param content - Multilingual content
 * @param includeEmpty - Whether to include languages with empty values
 * @returns Array of language codes
 */
export function getAvailableLanguages(
  content: MultilingualContent | null | undefined,
  includeEmpty: boolean = false,
): string[] {
  if (!content) return []

  if (includeEmpty) {
    return Object.keys(content)
  }

  return Object.keys(content).filter((lang) => {
    const value = get(content, lang)

    return value && value.trim().length > 0
  })
}

/**
 * Compares two multilingual contents for equality
 *
 * @param a - First multilingual content
 * @param b - Second multilingual content
 * @param ignoreEmpty - Whether to ignore empty values in comparison
 * @returns True if contents are equal
 */
export function areMultilingualContentsEqual(
  a: MultilingualContent | null | undefined,
  b: MultilingualContent | null | undefined,
  ignoreEmpty: boolean = false,
): boolean {
  // Handle null/undefined cases
  if (!a && !b) return true
  if (!a || !b) return false

  const cleanA = ignoreEmpty ? cleanMultilingualContent(a, false) : a
  const cleanB = ignoreEmpty ? cleanMultilingualContent(b, false) : b

  // Check if same languages
  const keysA = Object.keys(cleanA).sort()
  const keysB = Object.keys(cleanB).sort()

  if (keysA.length !== keysB.length) return false
  if (!keysA.every((key, i) => key === keysB.at(i))) return false

  // Check if same values
  return keysA.every((key) => get(cleanA, key) === get(cleanB, key))
}

/**
 * Extracts a subset of languages from multilingual content
 *
 * @param content - Source multilingual content
 * @param languages - Languages to extract
 * @returns New multilingual content with only specified languages
 */
export function extractLanguages(
  content: MultilingualContent,
  languages: string[],
): Partial<MultilingualContent> {
  return pickBy(content, (_, key) =>
    languages.includes(key),
  ) as Partial<MultilingualContent>
}

/**
 * Fills missing languages with a default value or from another source
 *
 * @param content - Multilingual content to fill
 * @param languages - Languages that should exist
 * @param defaultValue - Default value or source content
 * @returns Multilingual content with all specified languages
 */
export function fillMissingLanguages(
  content: MultilingualContent,
  languages: string[] = SUPPORTED_LANGUAGES,
  defaultValue: string | MultilingualContent = '',
): MultilingualContent {
  const filled = { ...content }

  languages.forEach((lang) => {
    if (!get(filled, lang)) {
      if (typeof defaultValue === 'string') {
        set(filled, lang, defaultValue)
      } else if (get(defaultValue, lang)) {
        set(filled, lang, get(defaultValue, lang))
      } else {
        set(filled, lang, defaultValue.en || '')
      }
    }
  })

  return filled
}

/**
 * Transforms multilingual content using a mapping function
 *
 * @param content - Source multilingual content
 * @param transformer - Function to transform each value
 * @returns Transformed multilingual content
 */
export function transformMultilingualContent(
  content: MultilingualContent,
  transformer: (value: string, lang: string) => string,
): MultilingualContent {
  const transformed: MultilingualContent = {} as MultilingualContent

  Object.keys(content).forEach((lang) => {
    const value = get(content, lang)

    if (value !== undefined) {
      set(transformed, lang, transformer(value, lang))
    }
  })

  return transformed
}

/**
 * Creates a multilingual content object from a single value
 *
 * @param value - Value to use for all languages
 * @param languages - Languages to include
 * @returns Multilingual content with same value for all languages
 */
export function createUniformMultilingualContent(
  value: string,
  languages: string[] = SUPPORTED_LANGUAGES,
): MultilingualContent {
  const content: MultilingualContent = {} as MultilingualContent

  languages.forEach((lang) => {
    set(content, lang, value)
  })

  return content
}

/**
 * Validates and normalizes multilingual content for API responses
 * Ensures consistent structure and applies any transformations
 *
 * @param content - Raw multilingual content
 * @param fieldName - Field name for error messages
 * @param config - Validation configuration
 * @returns Normalized multilingual content
 */
export function normalizeMultilingualText(
  content: unknown,
  fieldName: string,
  config?: MultilingualFieldConfig,
): MultilingualContent | undefined {
  // Use existing validation with null safety
  const validated = ensureMultilingualContent(content, fieldName, config)

  if (!validated) {
    return undefined
  }

  // Ensure all supported languages exist (even if empty)
  return fillMissingLanguages(validated, SUPPORTED_LANGUAGES, '')
}

/**
 * Type guard to check if a value is valid multilingual content
 *
 * @param value - Value to check
 * @returns True if value is valid multilingual content
 */
export function isMultilingualContent(
  value: unknown,
): value is MultilingualContent {
  if (!value || !isObject(value)) return false

  const obj = value as Record<string, unknown>

  // Must have at least English
  if (!obj.en || typeof obj.en !== 'string') return false

  // All values must be strings
  return Object.values(obj).every(
    (val) => val === undefined || typeof val === 'string',
  )
}

/**
 * Creates a summary of multilingual content for logging or debugging
 *
 * @param content - Multilingual content
 * @param maxLength - Maximum length for each language value
 * @returns Summary string
 */
export function summarizeMultilingualContent(
  content: MultilingualContent | null | undefined,
  maxLength: number = 20,
): string {
  if (!content) return '[empty]'

  const languages = getAvailableLanguages(content, false)

  if (languages.length === 0) return '[no content]'

  const summaries = languages
    .map((lang) => {
      const value = get(content, lang)

      if (value === undefined) return ''

      const truncated =
        value.length > maxLength
          ? value.substring(0, maxLength - 3) + '...'
          : value

      return `${lang}:"${truncated}"`
    })
    .filter((s) => s !== '')

  return `{${summaries.join(', ')}}`
}
