import { Type } from '@sinclair/typebox'
import { set } from 'lodash-es'

/**
 * Generic interface for multilingual content with dynamic language keys
 */
export interface MultilingualContent {
  [language: string]: string
}

/**
 * Available system languages, used for schema validation
 */
export enum SystemLanguage {
  SPANISH = 'es',
  ENGLISH = 'en',
  GUARANI = 'gn',
}

/**
 * Default language to use when a specific language isn't available
 */
export const DEFAULT_LANGUAGE = SystemLanguage.ENGLISH

/**
 * All supported system languages
 */
export const SUPPORTED_LANGUAGES = Object.values(SystemLanguage)

/**
 * Creates a simple object-based schema for multilingual content
 *
 * @param maxLength Maximum length for the string content
 * @param requiredLanguages Array of language codes that are required (default: only the default language)
 * @returns TypeBox schema for multilingual content
 */
export function createDynamicMultilingualSchema(
  maxLength: number,
  requiredLanguages: SystemLanguage[] = [DEFAULT_LANGUAGE],
) {
  // Create a simpler object-based schema that doesn't use complex references
  const properties: Record<string, any> = {}

  // Add all possible language properties
  for (const lang of SUPPORTED_LANGUAGES) {
    if (requiredLanguages.includes(lang)) {
      set(properties, lang, Type.String({ minLength: 1, maxLength }))
    } else {
      set(properties, lang, Type.Optional(Type.String({ maxLength })))
    }
  }

  return Type.Object(properties, { additionalProperties: false })
}

/**
 * Type for the transformed response with flattened multilingual content
 */
export type LocalizedResponse<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends Record<string, string>
        ? string
        : T[K] extends Array<infer U>
          ? Array<LocalizedResponse<U>>
          : T[K] extends object
            ? LocalizedResponse<T[K]>
            : T[K]
    }
  : T
