import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

// Service configuration
export const SERVICE_HOST = getEnvVariable('SERVICE_HOST', String, '0.0.0.0')

// User service name
export const USER_SERVICE_NAME = getEnvVariable(
  'USER_SERVICE_NAME',
  String,
  'user_service',
)

// User service port
export const USER_SERVICE_PORT = getEnvVariable(
  'USER_SERVICE_PORT',
  parseNumber,
  5501,
)

// User service host
export const USER_SERVICE_HOST = getEnvVariable(
  'USER_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Auth service name
export const AUTH_SERVICE_NAME = getEnvVariable(
  'AUTH_SERVICE_NAME',
  String,
  'auth_service',
)

// Auth service port
export const AUTH_SERVICE_PORT = getEnvVariable(
  'AUTH_SERVICE_PORT',
  parseNumber,
  5502,
)

// Auth service host
export const AUTH_SERVICE_HOST = getEnvVariable(
  'AUTH_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Gym service name
export const GYM_SERVICE_NAME = getEnvVariable(
  'GYM_SERVICE_NAME',
  String,
  'gym_service',
)

// Gym service port
export const GYM_SERVICE_PORT = getEnvVariable(
  'GYM_SERVICE_PORT',
  parseNumber,
  5503,
)

// Gym service host
export const GYM_SERVICE_HOST = getEnvVariable(
  'GYM_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Session service name
export const SESSION_SERVICE_NAME = getEnvVariable(
  'SESSION_SERVICE_NAME',
  String,
  'session_service',
)

// Session service port
export const SESSION_SERVICE_PORT = getEnvVariable(
  'SESSION_SERVICE_PORT',
  parseNumber,
  5504,
)

// Session service host
export const SESSION_SERVICE_HOST = getEnvVariable(
  'SESSION_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Payment service name
export const PAYMENT_SERVICE_NAME = getEnvVariable(
  'PAYMENT_SERVICE_NAME',
  String,
  'payment_service',
)

// Payment service port
export const PAYMENT_SERVICE_PORT = getEnvVariable(
  'PAYMENT_SERVICE_PORT',
  parseNumber,
  5505,
)

// Payment service host
export const PAYMENT_SERVICE_HOST = getEnvVariable(
  'PAYMENT_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Subscription service name
export const SUBSCRIPTION_SERVICE_NAME = getEnvVariable(
  'SUBSCRIPTION_SERVICE_NAME',
  String,
  'subscription_service',
)

// Subscription service port
export const SUBSCRIPTION_SERVICE_PORT = getEnvVariable(
  'SUBSCRIPTION_SERVICE_PORT',
  parseNumber,
  5506,
)

// Subscription service host
export const SUBSCRIPTION_SERVICE_HOST = getEnvVariable(
  'SUBSCRIPTION_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Communication service name
export const COMMUNICATION_SERVICE_NAME = getEnvVariable(
  'COMMUNICATION_SERVICE_NAME',
  String,
  'communication_service',
)

// Communication service port
export const COMMUNICATION_SERVICE_PORT = getEnvVariable(
  'COMMUNICATION_SERVICE_PORT',
  parseNumber,
  5507,
)

// Communication service host
export const COMMUNICATION_SERVICE_HOST = getEnvVariable(
  'COMMUNICATION_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Support service name
export const SUPPORT_SERVICE_NAME = getEnvVariable(
  'SUPPORT_SERVICE_NAME',
  String,
  'support_service',
)

// Support service port
export const SUPPORT_SERVICE_PORT = getEnvVariable(
  'SUPPORT_SERVICE_PORT',
  parseNumber,
  5508,
)

// Support service host
export const SUPPORT_SERVICE_HOST = getEnvVariable(
  'SUPPORT_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Social service name
export const SOCIAL_SERVICE_NAME = getEnvVariable(
  'SOCIAL_SERVICE_NAME',
  String,
  'social_service',
)

// Social service port
export const SOCIAL_SERVICE_PORT = getEnvVariable(
  'SOCIAL_SERVICE_PORT',
  parseNumber,
  5509,
)

// Social service host
export const SOCIAL_SERVICE_HOST = getEnvVariable(
  'SOCIAL_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// File Storage service name
export const FILE_STORAGE_SERVICE_NAME = getEnvVariable(
  'FILE_STORAGE_SERVICE_NAME',
  String,
  'file_storage_service',
)

// File Storage service port
export const FILE_STORAGE_SERVICE_PORT = getEnvVariable(
  'FILE_STORAGE_SERVICE_PORT',
  parseNumber,
  5510,
)

// File Storage service host
export const FILE_STORAGE_SERVICE_HOST = getEnvVariable(
  'FILE_STORAGE_SERVICE_HOST',
  String,
  '0.0.0.0',
)
