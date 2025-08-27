import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'

// JWT Algorithm Configuration (RS256 is industry standard)
export const JWT_ALGORITHM = getEnvVariable(
  'JWT_ALGORITHM',
  parseString,
  'RS256',
)

// JWT Key Pair for RS256 (REQUIRED - no defaults for security)
export const JWT_PRIVATE_KEY = getEnvVariable('JWT_PRIVATE_KEY', parseString)

export const JWT_PUBLIC_KEY = getEnvVariable('JWT_PUBLIC_KEY', parseString)
export const INTERNAL_API_TOKEN = getEnvVariable('INTERNAL_API_TOKEN', String)
export const JWT_ACCESS_TOKEN_EXPIRY = getEnvVariable(
  'JWT_ACCESS_EXPIRY',
  parseString,
  '15m',
)
export const JWT_REFRESH_TOKEN_EXPIRY = getEnvVariable(
  'JWT_REFRESH_EXPIRY',
  parseString,
  '7d',
)
export const JWT_ISSUER = getEnvVariable('JWT_ISSUER', parseString, 'pika-api')
export const JWT_AUDIENCE = getEnvVariable(
  'JWT_AUDIENCE',
  parseString,
  'pikapp',
)
export const AUTH_PROVIDER = getEnvVariable(
  'AUTH_PROVIDER',
  parseString,
  'local',
)
export const SKIP_AUTH = getEnvVariable('SKIP_AUTH', parseBoolean, false)

// Legacy JWT expiry constants (still used by some services)
export const JWT_ACCESS_EXPIRY = getEnvVariable(
  'JWT_ACCESS_EXPIRY',
  parseString,
  '15m',
)
export const JWT_REFRESH_EXPIRY = getEnvVariable(
  'JWT_REFRESH_EXPIRY',
  parseString,
  '7d',
)

// Service-to-Service Authentication
export const SERVICE_API_KEY = getEnvVariable('SERVICE_API_KEY', parseString)

// ============================================
// Firebase Configuration
// ============================================

// Firebase Web SDK Configuration
export const FIREBASE_API_KEY = getEnvVariable(
  'FIREBASE_API_KEY',
  parseString,
  '',
)
export const FIREBASE_AUTH_DOMAIN = getEnvVariable(
  'FIREBASE_AUTH_DOMAIN',
  parseString,
  '',
)
export const FIREBASE_PROJECT_ID = getEnvVariable(
  'FIREBASE_PROJECT_ID',
  parseString,
  '',
)
export const FIREBASE_STORAGE_BUCKET = getEnvVariable(
  'FIREBASE_STORAGE_BUCKET',
  parseString,
  '',
)
export const FIREBASE_MESSAGING_SENDER_ID = getEnvVariable(
  'FIREBASE_MESSAGING_SENDER_ID',
  parseString,
  '',
)
export const FIREBASE_APP_ID = getEnvVariable(
  'FIREBASE_APP_ID',
  parseString,
  '',
)
export const FIREBASE_MEASUREMENT_ID = getEnvVariable(
  'FIREBASE_MEASUREMENT_ID',
  parseString,
  '',
)

// Firebase Admin SDK Configuration
export const FIREBASE_PRIVATE_KEY_ID = getEnvVariable(
  'FIREBASE_PRIVATE_KEY_ID',
  parseString,
  '',
)
export const FIREBASE_PRIVATE_KEY = getEnvVariable(
  'FIREBASE_PRIVATE_KEY',
  (value: string) => value.replace(/\\n/g, '\n'),
  '',
)
export const FIREBASE_CLIENT_EMAIL = getEnvVariable(
  'FIREBASE_CLIENT_EMAIL',
  parseString,
  '',
)
export const FIREBASE_CLIENT_ID = getEnvVariable(
  'FIREBASE_CLIENT_ID',
  parseString,
  '',
)
export const FIREBASE_CLIENT_CERT_URL = getEnvVariable(
  'FIREBASE_CLIENT_CERT_URL',
  parseString,
  '',
)

// Social Provider Configuration
export const GOOGLE_CLIENT_ID = getEnvVariable(
  'GOOGLE_CLIENT_ID',
  parseString,
  '',
)
export const GOOGLE_CLIENT_SECRET = getEnvVariable(
  'GOOGLE_CLIENT_SECRET',
  parseString,
  '',
)
export const FACEBOOK_APP_ID = getEnvVariable(
  'FACEBOOK_APP_ID',
  parseString,
  '',
)
export const FACEBOOK_APP_SECRET = getEnvVariable(
  'FACEBOOK_APP_SECRET',
  parseString,
  '',
)
export const APPLE_CLIENT_ID = getEnvVariable(
  'APPLE_CLIENT_ID',
  parseString,
  '',
)
export const APPLE_TEAM_ID = getEnvVariable('APPLE_TEAM_ID', parseString, '')
export const APPLE_KEY_ID = getEnvVariable('APPLE_KEY_ID', parseString, '')
export const APPLE_PRIVATE_KEY = getEnvVariable(
  'APPLE_PRIVATE_KEY',
  parseString,
  '',
)

// Firebase configuration object for client SDK
export const FIREBASE_CONFIG = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
}

// Firebase Admin SDK service account configuration
export const FIREBASE_SERVICE_ACCOUNT = {
  type: 'service_account' as const,
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: FIREBASE_PRIVATE_KEY,
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: FIREBASE_CLIENT_CERT_URL,
  universe_domain: 'googleapis.com',
}

// Firebase Emulator Configuration
export const FIREBASE_AUTH_EMULATOR_HOST = getEnvVariable(
  'FIREBASE_AUTH_EMULATOR_HOST',
  parseString,
  '',
)

// Helper to check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  )
}
