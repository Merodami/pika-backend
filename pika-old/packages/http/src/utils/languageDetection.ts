import { DEFAULT_LANGUAGE } from '@pika/environment'
import { SUPPORTED_LANGUAGES } from '@pika/types-core'
import type { FastifyRequest } from 'fastify'

/**
 * Determines the preferred language from a Fastify request object
 *
 * This utility extracts the preferred language from:
 * 1. Query parameters (highest priority)
 * 2. Accept-Language header via the accepts plugin
 * 3. Fallback to default language
 *
 * @param request - The Fastify request object
 * @param supportedLanguages - Optional array of supported language codes
 * @param defaultLanguage - Default language to use if no preference found
 * @returns The preferred language code
 */
export function getPreferredLanguage(
  request: FastifyRequest,
  supportedLanguages: string[] = SUPPORTED_LANGUAGES,
  defaultLanguage: string = DEFAULT_LANGUAGE,
): string {
  // Only use Accept-Language header for language detection
  const acceptLanguage = request.headers['accept-language']

  // Special case for 'all' language value in Accept-Language header
  if (acceptLanguage === 'all') {
    return 'all'
  }

  // Use accepts plugin for standard content negotiation if available
  const accepts = request.accepts()
  const preferred = accepts.language(supportedLanguages)

  if (preferred) {
    return preferred
  }

  // Fallback to default language
  return defaultLanguage
}
