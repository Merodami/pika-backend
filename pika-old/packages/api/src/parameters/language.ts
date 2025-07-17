import { DEFAULT_LANGUAGE } from '@pika/environment'
import { OpenAPIV3 } from 'openapi-types'

/**
 * Accept-Language header parameter, following RFC 7231 & RFC 5646 standards
 */
export const AcceptLanguageParam: OpenAPIV3.ParameterObject = {
  name: 'Accept-Language',
  in: 'header',
  description:
    'Language preference for API responses containing multilingual content (eg: "en", "es", "en-US", or with quality values "en, es;q=0.8, gn;q=0.5")',
  required: false,
  schema: {
    type: 'string',
    default: DEFAULT_LANGUAGE,
    example: 'en, es;q=0.8, gn;q=0.5',
  },
}
