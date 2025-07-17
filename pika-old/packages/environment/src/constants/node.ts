import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

export const NODE_ENV = getEnvVariable('NODE_ENV', parseString, 'development')
export const ENV_STAGE = getEnvVariable('ENV_STAGE', parseString, 'development')
export const LOG_LEVEL = getEnvVariable(
  'LOG_LEVEL',
  (v: string) =>
    ['debug', 'info', 'warn', 'error'].includes(v)
      ? v
      : (() => {
          throw new Error(`Invalid log level "${v}".`)
        })(),
  'debug',
)
export const DEFAULT_TIMEZONE = getEnvVariable(
  'DEFAULT_TIMEZONE',
  String,
  'Europe/Belgium',
)
export const TIMEZONE = getEnvVariable(
  'TIMEZONE',
  parseString,
  'America/Asuncion',
)
