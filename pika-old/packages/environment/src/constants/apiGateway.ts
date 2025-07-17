import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'

export const CORS_ORIGIN = getEnvVariable('CORS_ORIGIN', parseString, '*')
export const ENABLE_HELMET = getEnvVariable('ENABLE_HELMET', parseBoolean, true)
export const ENABLE_CORS = getEnvVariable('ENABLE_CORS', parseBoolean, true)
export const ENABLE_COMPRESSION = getEnvVariable(
  'ENABLE_COMPRESSION',
  parseBoolean,
  true,
)
export const API_GATEWAY_PORT = getEnvVariable('API_GATEWAY_PORT', Number, 3000)
