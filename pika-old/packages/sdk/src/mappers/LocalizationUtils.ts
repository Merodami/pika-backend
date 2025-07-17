import { DEFAULT_LANGUAGE } from '@pika/environment'
import { MultilingualContent } from '@pika/types-core'
import { cloneDeep, get, isArray, isObject, isString, set } from 'lodash-es'

/**
 * Determines if an object is likely a multilingual text object
 * Checks for typical properties of a multilingual text object (has language properties)
 */
function isMultilingualText(obj: any): obj is MultilingualContent {
  return (
    isObject(obj) &&
    !isArray(obj) &&
    (isString((obj as any).en) ||
      isString((obj as any).es) ||
      isString((obj as any).gn))
  )
}

/**
 * Extracts the value for the specified language from a multilingual text object
 * Falls back to default language if requested language isn't available
 */
function extractLocalizedValue(
  multilingualObj: MultilingualContent,
  lang: string,
  defaultLang = DEFAULT_LANGUAGE,
): string {
  return (
    (get(multilingualObj, lang) as string) ||
    (get(multilingualObj, defaultLang) as string) ||
    ''
  )
}

/**
 * Recursively transforms an object, converting multilingual objects to single language strings
 * Uses lodash for efficient, immutable transformations
 *
 * @param obj The object to transform
 * @param lang The language code to extract (e.g., 'en', 'es', 'gn')
 * @param defaultLang The fallback language if requested language is not available (default: 'en')
 * @returns A new object with multilingual fields replaced by strings in the requested language
 */
export function localizeObject<T>(
  obj: T,
  lang: string,
  defaultLang = DEFAULT_LANGUAGE,
): T {
  if (!isObject(obj)) {
    return obj
  }

  // Create a deep clone to avoid mutating the original
  const result = cloneDeep(obj)

  // Process recursively
  function processValue(value: any): any {
    // Handle null or undefined
    if (value == null) {
      return value
    }

    // Handle arrays
    if (isArray(value)) {
      return value.map(processValue)
    }

    // Handle objects
    if (isObject(value)) {
      // For objects that look like they have multilingual fields
      const objAny = value as Record<string, any>

      if (
        (objAny.name && isMultilingualText(objAny.name)) ||
        (objAny.description && isMultilingualText(objAny.description))
      ) {
        const processed: Record<string, any> = { ...objAny }

        // Transform name field if it exists and is multilingual
        if (objAny.name && isMultilingualText(objAny.name)) {
          processed.name = extractLocalizedValue(objAny.name, lang, defaultLang)
        }

        // Transform description field if it exists and is multilingual
        if (objAny.description && isMultilingualText(objAny.description)) {
          processed.description = extractLocalizedValue(
            objAny.description,
            lang,
            defaultLang,
          )
        }

        // Process any other fields recursively
        for (const key in processed) {
          if (
            key !== 'name' &&
            key !== 'description' &&
            Object.prototype.hasOwnProperty.call(processed, key)
          ) {
            const fieldValue = get(processed, key)

            set(processed, key, processValue(fieldValue))
          }
        }

        return processed
      }

      // For regular objects, process each property recursively
      const processed: Record<string, any> = { ...objAny }

      for (const key in processed) {
        if (Object.prototype.hasOwnProperty.call(processed, key)) {
          const propValue = get(processed, key)

          set(processed, key, processValue(propValue))
        }
      }

      return processed
    }

    // Return primitive values as is
    return value
  }

  return processValue(result)
}
