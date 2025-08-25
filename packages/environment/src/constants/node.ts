import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'

export const NODE_ENV = getEnvVariable('NODE_ENV', parseString, 'development')
export const ENV_STAGE = getEnvVariable('ENV_STAGE', parseString, 'development')
export const LOG_LEVEL = getEnvVariable('LOG_LEVEL', parseString, 'debug')
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
export const VALIDATE_RESPONSES = getEnvVariable(
  'VALIDATE_RESPONSES',
  parseBoolean,
  NODE_ENV !== 'production',
)

// Deployment mode: 'local' | 'serverless' | 'monolith'
// - local: Separate services on different ports (development)
// - serverless: Embedded services in serverless environment (Vercel, Lambda)
// - monolith: Embedded services on traditional server
export const DEPLOYMENT_MODE = getEnvVariable(
  'DEPLOYMENT_MODE',
  parseString,
  'local',
)
export const IS_SERVERLESS = DEPLOYMENT_MODE === 'serverless'
export const IS_LOCAL = DEPLOYMENT_MODE === 'local'
export const IS_EMBEDDED =
  DEPLOYMENT_MODE === 'serverless' || DEPLOYMENT_MODE === 'monolith'
