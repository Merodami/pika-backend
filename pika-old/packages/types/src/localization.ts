/**
 * Definition for fields that should be localized in an entity
 */
export interface LocalizationConfig<T> {
  /**
   * Array of field paths that contain multilingual content
   * Supports dot notation for nested fields
   *
   * Example: ['name', 'description', 'metadata.title']
   */
  multilingualFields: Array<keyof T | string>

  /**
   * Handler for recursive fields (like children or items)
   * Specifies a field that contains an array of objects that
   * should be processed using the same localization config
   *
   * Example: { field: 'children', config: categoryLocalizationConfig }
   */
  recursiveFields?: Array<{
    field: keyof T | string
    config: LocalizationConfig<any>
  }>
}

/**
 * Basic interface for multilingual content
 * All three languages are always required to ensure database consistency
 */
export interface MultilingualContent {
  en: string
  es: string
  gn: string
  [key: string]: string // Allow additional languages
}

/**
 * Default supported languages in the system
 */
export const SUPPORTED_LANGUAGES = ['es', 'en', 'gn']
