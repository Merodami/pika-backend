import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

export const DEFAULT_LANGUAGE = getEnvVariable(
  'DEFAULT_LANGUAGE',
  parseString,
  'en',
)
export const SUPPORTED_LANGUAGES = getEnvVariable(
  'SUPPORTED_LANGUAGES',
  (v: string) => v.split(','),
  ['es', 'en', 'gn'],
)
