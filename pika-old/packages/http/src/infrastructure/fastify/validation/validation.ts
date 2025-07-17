import { TSchema } from '@sinclair/typebox'
import { Ajv, ErrorObject } from 'ajv'
import _addFormats from 'ajv-formats'
import { FastifyRequest } from 'fastify'

// Import the Ajv formats plugin fix (cannot import directly AddFormat)
const addFormats = _addFormats as unknown as typeof _addFormats.default

// 1. Create a single, configured AJV instance.
// This instance will be used by Fastify for all schema validations.
const ajv = new Ajv({
  allErrors: true, // Show all errors, not just the first
  coerceTypes: 'array', // Coerce types where appropriate
  useDefaults: true,
})

addFormats(ajv) // Add formats like 'email', 'uuid', etc.

/**
 * Creates a custom validator compiler for Fastify.
 * This function is passed to the Fastify constructor.
 * It ensures that our configured AJV instance is used for compiling schemas.
 */
export function createValidatorCompiler() {
  return function validatorCompiler({
    schema,
    httpPart,
  }: {
    schema: TSchema
    httpPart?: string
  }) {
    const validate = ajv.compile(schema)

    return function (data: unknown) {
      const valid = validate(data)

      if (valid) {
        return { value: data }
      }

      // Create a proper FastifyError that will be caught by our error handler
      const error = new Error('Validation failed') as any

      error.code = 'FST_ERR_VALIDATION'
      error.validation = validate.errors || []
      error.validationContext = httpPart || 'body'

      throw error
    }
  }
}

/**
 * Parses the Accept-Language header to find the best supported language.
 * @param request - The Fastify request object.
 * @returns A supported language code (e.g., 'es', 'fr') or defaults to 'en'.
 */
function getLanguage(request: FastifyRequest): string {
  const header = request.headers['accept-language']

  if (!header) {
    return 'en' // Default language
  }

  const languages = header
    .split(',')
    .map((lang) => lang.split(';')[0].toLowerCase().trim())

  const supportedLanguages = ['en', 'es', 'gn', 'pt'] // English, Spanish, Guarani, Portuguese

  for (const lang of languages) {
    if (supportedLanguages.includes(lang)) {
      return lang
    }

    const baseLang = lang.split('-')[0]

    if (supportedLanguages.includes(baseLang)) {
      return baseLang
    }
  }

  return 'en' // Fallback to default
}

/**
 * Translates an array of AJV errors in place.
 * @param errors - The array of ErrorObject from a validation failure.
 * @param request - The Fastify request, used to determine the language.
 */
export async function translateValidationErrors(
  errors: ErrorObject[],
  request: FastifyRequest,
): Promise<void> {
  const lang = getLanguage(request)

  // If the language is English, no translation is needed as it's the default.
  if (lang === 'en') {
    return
  }

  try {
    // Dynamically load only the language we need
    const localize = (await import(`ajv-i18n/localize/${lang}/index.js`))
      .default

    localize(errors)

    request.log.info(
      { lang },
      `Successfully translated validation errors to '${lang}'.`,
    )
  } catch {
    request.log.warn(
      `AJV locale for '${lang}' not found. Falling back to English.`,
    )
  }
}
