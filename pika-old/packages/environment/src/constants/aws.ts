import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

export const AWS_REGION = getEnvVariable('AWS_REGION', parseString, 'us-east-1')
export const AWS_ACCESS_KEY_ID = getEnvVariable(
  'AWS_ACCESS_KEY_ID',
  String,
  'test',
)
export const AWS_SECRET_ACCESS_KEY = getEnvVariable(
  'AWS_SECRET_ACCESS_KEY',
  String,
  'test',
)
export const AWS_ENDPOINT_URL = getEnvVariable(
  'AWS_ENDPOINT_URL',
  String,
  'http://localhost:5567',
)
export const AWS_S3_BUCKET = getEnvVariable(
  'AWS_S3_BUCKET',
  String,
  'marketplace-uploads',
)
export const MAX_UPLOAD_SIZE = getEnvVariable(
  'MAX_UPLOAD_SIZE',
  Number,
  5 * 1024 * 1024,
) // 5MB

// AWS Cognito
export const USER_POOL_ID = getEnvVariable('USER_POOL_ID', parseString, '')
export const USER_POOL_CLIENT_ID = getEnvVariable(
  'USER_POOL_CLIENT_ID',
  parseString,
  '',
)
export const COGNITO_USER_POOL_ID = getEnvVariable(
  'COGNITO_USER_POOL_ID',
  parseString,
  '',
)
export const COGNITO_CLIENT_ID = getEnvVariable(
  'COGNITO_CLIENT_ID',
  parseString,
  '',
)
export const COGNITO_REGION = getEnvVariable(
  'COGNITO_REGION',
  parseString,
  'us-east-1',
)
