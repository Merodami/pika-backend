import { DEFAULT_LANGUAGE } from '@pika/environment'
import { LocalizationConfig, MultilingualContent } from '@pika/types-core'
import { cloneDeep, get, isArray, isObject, set } from 'lodash-es'

/**
 * Extracts the value for the requested language from multilingual content
 *
 * @param content Multilingual content object
 * @param language Requested language code
 * @param fallbackLanguage Fallback language to use if requested language is not available
 * @returns The extracted content in appropriate language
 */
export function getLocalizedValue(
  content: MultilingualContent | null | undefined,
  language?: string,
  fallbackLanguage: string = DEFAULT_LANGUAGE,
): string {
  if (!content) {
    return ''
  }

  // If language specified and exists, use it
  if (language && get(content, language)) {
    return get(content, language)
  }

  // Otherwise use fallback
  if (get(content, fallbackLanguage)) {
    return get(content, fallbackLanguage)
  }

  // Last resort: use any available language
  const firstKey = Object.keys(content)[0]

  return firstKey ? get(content, firstKey) : ''
}

/**
 * Transforms multilingual fields in an object according to localization config
 *
 * @param data Original data object
 * @param config Localization configuration specifying which fields to process
 * @param language Requested language
 * @param fallbackLanguage Fallback language
 * @returns A new object with transformed multilingual fields
 */
export function localizeData<T>(
  data: T,
  config: LocalizationConfig<T>,
  language?: string,
  fallbackLanguage: string = DEFAULT_LANGUAGE,
): T {
  if (!data || !config) {
    return data
  }

  // Skip localization if no language specified
  if (!language) {
    return data
  }

  // Deep clone to avoid modifying original
  const result = cloneDeep(data)

  // Process multilingual fields
  for (const fieldPath of config.multilingualFields) {
    const path = fieldPath.toString()
    const multilingualObj = get(result, path)

    // Check if it's a valid multilingual object
    if (isObject(multilingualObj) && !isArray(multilingualObj)) {
      // Select the appropriate language or fallback
      if (language) {
        // Handle the object structure
        const objAny = multilingualObj as Record<string, any>

        // Handle legacy data formats with nested structures
        const multilingual =
          // Check for 'values' property first (current format in the system)
          objAny.values && isObject(objAny.values)
            ? objAny.values
            : // Check for 'translations' property second (old format)
              objAny.translations && isObject(objAny.translations)
              ? objAny.translations
              : // Default to direct access
                objAny

        // Check if it's already a string value
        if (typeof multilingual === 'string') {
          // Already a string, keep it as is
          set(result, path, multilingual)
        } else {
          // Extract language-specific value from the object
          const selectedValue =
            language in multilingual
              ? get(multilingual, language)
              : fallbackLanguage in multilingual
                ? get(multilingual, fallbackLanguage)
                : ''

          // Replace the multilingual object with just the string value
          set(result, path, selectedValue)
        }
      } else {
        // If no language specified, keep the original object but ensure it's in the right format
        const objAny = multilingualObj as Record<string, any>

        // If the object has a 'translations' property, flatten it
        if (objAny.translations && isObject(objAny.translations)) {
          set(result, path, objAny.translations)
        } else {
          // Already in the right format, keep it
          set(result, path, objAny)
        }
      }
    }
  }

  // Process recursive fields (e.g., children, items, etc.)
  if (config.recursiveFields) {
    for (const { field, config: childConfig } of config.recursiveFields) {
      const fieldPath = field.toString()
      const nestedData = get(result, fieldPath)

      if (isArray(nestedData)) {
        // Process each item in the array using the same config
        const transformedItems = nestedData.map((item) =>
          localizeData(item, childConfig, language, fallbackLanguage),
        )

        set(result, fieldPath, transformedItems)
      } else if (isObject(nestedData)) {
        // Single nested object
        const transformedItem = localizeData(
          nestedData,
          childConfig,
          language,
          fallbackLanguage,
        )

        set(result, fieldPath, transformedItem)
      }
    }
  }

  return result
}

/**
 * Processes multilingual content based on language preference
 *
 * @param data Original data object or collection
 * @param config Localization configuration specifying multilingual fields
 * @param languagePreference Language preference (specific language code or 'all')
 * @param fallbackLanguage Fallback language to use if requested language not available
 * @returns Data with appropriately formatted multilingual content
 */
export function processMultilingualContent<T, R = any>(
  data: T,
  config: LocalizationConfig<T>,
  languagePreference: string = 'all',
  fallbackLanguage: string = DEFAULT_LANGUAGE,
): R {
  // Skip processing if no data or config
  if (!data || !config) {
    return data as unknown as R
  }

  // Special handling for 'all' language preference
  if (languagePreference === 'all') {
    // For 'all', ensure we're returning full multilingual objects
    return ensureMultilingualObjects(data, config) as unknown as R
  } else {
    // For specific language, return object with only that language
    const result = createFilteredLanguageFormat(
      data,
      config,
      languagePreference,
      fallbackLanguage,
    ) as unknown as R

    return result
  }
}

/**
 * Ensures all multilingual fields are in object format, not string format
 * This is useful for the 'all' language mode to ensure consistent output
 */
function ensureMultilingualObjects<T>(
  data: T,
  config: LocalizationConfig<T>,
): T {
  if (!data || !config) {
    return data
  }

  const result = cloneDeep(data) as any

  // Process multilingual fields
  for (const fieldPath of config.multilingualFields) {
    const path = fieldPath.toString()
    const fieldValue = get(result, path)

    // If it's already a string, convert to object format
    if (typeof fieldValue === 'string') {
      const multilingualObj = {
        es: fieldValue,
        en: fieldValue,
        gn: fieldValue,
      }

      set(result, path, multilingualObj)
    }
    // If it's already an object, ensure it has expected structure AND required languages
    else if (isObject(fieldValue) && !isArray(fieldValue)) {
      const content = { ...(fieldValue as Record<string, any>) } // Clone to avoid modifying original in unexpected ways

      // Ensure standard languages (es, en, gn) are present, defaulting to empty string.
      // Spread the original content after the defaults to ensure existing values are preserved/overwritten.
      const ensuredContent = {
        es: content.es || '', // Ensure 'es' key, default to empty string if not present
        en: content.en || '', // Ensure 'en' key
        gn: content.gn || '', // Ensure 'gn' key (if applicable)
        ...content, // Spread the possibly-modified content object
      }

      set(result, path, ensuredContent)
    }
  }

  // Process recursive fields
  if (config.recursiveFields) {
    for (const { field, config: childConfig } of config.recursiveFields) {
      const fieldPath = field.toString()
      const nestedData = get(result, fieldPath)

      if (isArray(nestedData)) {
        const transformedItems = nestedData.map((item) =>
          ensureMultilingualObjects(item, childConfig),
        )

        set(result, fieldPath, transformedItems)
      } else if (isObject(nestedData)) {
        const transformedItem = ensureMultilingualObjects(
          nestedData,
          childConfig,
        )

        set(result, fieldPath, transformedItem)
      }
    }
  }

  return result
}

/**
 * Creates a filtered language format where multilingual fields are
 * replaced with objects containing only the requested language.
 *
 * @param data Original data object
 * @param config Localization configuration
 * @param language Requested language
 * @param fallbackLanguage Fallback language
 * @returns A new object with multilingual fields as objects with single language
 */
export function createFilteredLanguageFormat<T, R = any>(
  data: T,
  config: LocalizationConfig<T>,
  language: string,
  fallbackLanguage: string = DEFAULT_LANGUAGE,
): R {
  if (!data || !config) {
    return data as unknown as R
  }

  const result = cloneDeep(data) as any

  // Process multilingual fields
  for (const fieldPath of config.multilingualFields) {
    const path = fieldPath.toString()
    const multilingualObj = get(result, path)

    if (isObject(multilingualObj) && !isArray(multilingualObj)) {
      const objAny = multilingualObj as Record<string, any>

      // Handle legacy data formats with nested structures
      const multilingual =
        // Check for 'values' property first (current format in the system)
        objAny.values && isObject(objAny.values)
          ? objAny.values
          : // Check for 'translations' property second (old format)
            objAny.translations && isObject(objAny.translations)
            ? objAny.translations
            : // Default to direct access
              objAny

      // Convert multilingual object to object with only requested language
      if (typeof multilingual === 'string') {
        // Already a string, convert to language object
        set(result, path, { [language]: multilingual })
      } else {
        // Extract just the value for the requested language
        const selectedValue =
          language in multilingual
            ? get(multilingual, language)
            : fallbackLanguage in multilingual
              ? get(multilingual, fallbackLanguage)
              : ''

        // Set object with only the requested language
        set(result, path, { [language]: selectedValue })
      }
    }
  }

  // Process recursive fields
  if (config.recursiveFields) {
    for (const { field, config: childConfig } of config.recursiveFields) {
      const fieldPath = field.toString()
      const nestedData = get(result, fieldPath)

      if (isArray(nestedData)) {
        const transformedItems = nestedData.map((item) =>
          createFilteredLanguageFormat(
            item,
            childConfig,
            language,
            fallbackLanguage,
          ),
        )

        set(result, fieldPath, transformedItems)
      } else if (isObject(nestedData)) {
        const transformedItem = createFilteredLanguageFormat(
          nestedData,
          childConfig,
          language,
          fallbackLanguage,
        )

        set(result, fieldPath, transformedItem)
      }
    }
  }

  return result
}

/**
 * Creates a fully localized object where multilingual fields are
 * replaced with single-language strings for frontend simplicity.
 *
 * @param data Original data object
 * @param config Localization configuration
 * @param language Requested language
 * @param fallbackLanguage Fallback language
 * @returns A new object with multilingual fields replaced by string values
 */
export function createLocalizedFormat<T, R = any>(
  data: T,
  config: LocalizationConfig<T>,
  language?: string,
  fallbackLanguage: string = DEFAULT_LANGUAGE,
): R {
  if (!data || !config) {
    return data as unknown as R
  }

  const result = cloneDeep(data) as any

  // Process multilingual fields
  for (const fieldPath of config.multilingualFields) {
    const path = fieldPath.toString()
    const multilingualObj = get(result, path)

    if (isObject(multilingualObj) && !isArray(multilingualObj)) {
      const objAny = multilingualObj as Record<string, any>

      // Handle legacy data formats with nested structures
      const multilingual =
        // Check for 'values' property first (current format in the system)
        objAny.values && isObject(objAny.values)
          ? objAny.values
          : // Check for 'translations' property second (old format)
            objAny.translations && isObject(objAny.translations)
            ? objAny.translations
            : // Default to direct access
              objAny

      // Convert multilingual object to single language string
      if (language) {
        // Check if this is already a string value
        if (typeof multilingual === 'string') {
          // Already a string, keep it as is
          set(result, path, multilingual)
        } else {
          // Extract just the value for the requested language
          const selectedValue =
            language in multilingual
              ? get(multilingual, language)
              : fallbackLanguage in multilingual
                ? get(multilingual, fallbackLanguage)
                : ''

          // Set the single language string value
          set(result, path, selectedValue)
        }
      } else {
        // If no specified language, keep the original object but in the correct format
        if (objAny.values && isObject(objAny.values)) {
          // Store just the values part for current format
          set(result, path, objAny.values)
        } else if (objAny.translations && isObject(objAny.translations)) {
          // Store just the translations part for old format
          set(result, path, objAny.translations)
        } else {
          // Already in the right format
          set(result, path, objAny)
        }
      }
    }
  }

  // Process recursive fields
  if (config.recursiveFields) {
    for (const { field, config: childConfig } of config.recursiveFields) {
      const fieldPath = field.toString()
      const nestedData = get(result, fieldPath)

      if (isArray(nestedData)) {
        const transformedItems = nestedData.map((item) =>
          createLocalizedFormat(item, childConfig, language, fallbackLanguage),
        )

        set(result, fieldPath, transformedItems)
      } else if (isObject(nestedData)) {
        const transformedItem = createLocalizedFormat(
          nestedData,
          childConfig,
          language,
          fallbackLanguage,
        )

        set(result, fieldPath, transformedItem)
      }
    }
  }

  return result
}
