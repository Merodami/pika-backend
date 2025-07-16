import { getEnvVariable } from '../getEnvVariable.js'
import { API_GATEWAY_BASE_URL } from './apiGateway.js'

export const USER_API_URL = getEnvVariable(
  'USER_API_URL',
  String,
  'http://localhost:5501',
)

export const AUTH_API_URL = getEnvVariable(
  'AUTH_API_URL',
  String,
  'http://localhost:5502',
)

export const GYM_API_URL = getEnvVariable(
  'GYM_API_URL',
  String,
  'http://localhost:5503',
)

export const SESSION_API_URL = getEnvVariable(
  'SESSION_API_URL',
  String,
  'http://localhost:5504',
)

export const PAYMENT_API_URL = getEnvVariable(
  'PAYMENT_API_URL',
  String,
  'http://localhost:5505',
)

export const SUBSCRIPTION_API_URL = getEnvVariable(
  'SUBSCRIPTION_API_URL',
  String,
  'http://localhost:5506',
)

export const COMMUNICATION_API_URL = getEnvVariable(
  'COMMUNICATION_API_URL',
  String,
  'http://localhost:5507',
)

export const SUPPORT_API_URL = getEnvVariable(
  'SUPPORT_API_URL',
  String,
  'http://localhost:5508',
)

export const SOCIAL_API_URL = getEnvVariable(
  'SOCIAL_API_URL',
  String,
  'http://localhost:5509',
)

export const FILE_STORAGE_API_URL = getEnvVariable(
  'FILE_STORAGE_API_URL',
  String,
  'http://localhost:5510',
)

export const LOCAL_AUTH_URL = getEnvVariable(
  'LOCAL_AUTH_URL',
  String,
  `${API_GATEWAY_BASE_URL}/local-env-user`,
)
