import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

export const FIREBASE_CONFIG = {
  projectId: getEnvVariable('FIREBASE_PROJECT_ID', parseString, ''),
  privateKey: getEnvVariable('FIREBASE_PRIVATE_KEY', parseString, ''),
  clientEmail: getEnvVariable('FIREBASE_CLIENT_EMAIL', parseString, ''),
  databaseUrl: getEnvVariable('FIREBASE_DATABASE_URL', parseString, ''),
  storageBucket: getEnvVariable('FIREBASE_STORAGE_BUCKET', parseString, ''),
}

export const FIREBASE_EMULATOR_CONFIG = {
  useEmulator: getEnvVariable('FIREBASE_EMULATOR', parseBoolean, false),
  host: getEnvVariable('FIREBASE_EMULATOR_HOST', parseString, 'localhost'),
  firestorePort: getEnvVariable('FIREBASE_FIRESTORE_PORT', parseNumber, 9080),
  authPort: getEnvVariable('FIREBASE_AUTH_PORT', parseNumber, 10099),
  functionsPort: getEnvVariable('FIREBASE_FUNCTIONS_PORT', parseNumber, 6001),
}

export const NOTIFICATION_CONFIG = {
  defaultExpirationDays: getEnvVariable(
    'NOTIFICATION_EXPIRATION_DAYS',
    parseNumber,
    30,
  ),
  batchSize: getEnvVariable('NOTIFICATION_BATCH_SIZE', parseNumber, 500),
  cleanupIntervalHours: getEnvVariable(
    'NOTIFICATION_CLEANUP_INTERVAL_HOURS',
    parseNumber,
    24,
  ),
}

// Additional Firebase configuration
export const FIREBASE_PROJECT_ID = getEnvVariable(
  'FIREBASE_PROJECT_ID',
  parseString,
  'pika-demo',
)
export const GOOGLE_APPLICATION_CREDENTIALS = getEnvVariable(
  'GOOGLE_APPLICATION_CREDENTIALS',
  parseString,
  '',
)
export const FIREBASE_AUTH_EMULATOR_HOST = getEnvVariable(
  'FIREBASE_AUTH_EMULATOR_HOST',
  parseString,
  'localhost:10099',
)
