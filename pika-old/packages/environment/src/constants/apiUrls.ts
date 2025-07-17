import { getEnvVariable } from '../getEnvVariable.js'

export const CATEGORY_API_URL = getEnvVariable(
  'CATEGORY_API_URL',
  String,
  'http://localhost:5000',
)

export const PROVIDER_API_URL = getEnvVariable(
  'PROVIDER_API_URL',
  String,
  'http://localhost:5027',
)

export const USER_API_URL = getEnvVariable(
  'USER_API_URL',
  String,
  'http://localhost:5003',
)

export const NOTIFICATION_API_URL = getEnvVariable(
  'NOTIFICATION_API_URL',
  String,
  'http://localhost:5004',
)

export const MESSAGING_API_URL = getEnvVariable(
  'MESSAGING_API_URL',
  String,
  'http://localhost:5005',
)

export const VOUCHER_API_URL = getEnvVariable(
  'VOUCHER_API_URL',
  String,
  'http://localhost:5001',
)

export const REDEMPTION_API_URL = getEnvVariable(
  'REDEMPTION_API_URL',
  String,
  'http://localhost:5002',
)

export const REVIEW_API_URL = getEnvVariable(
  'REVIEW_API_URL',
  String,
  'http://localhost:5028',
)

export const PDF_GENERATOR_API_URL = getEnvVariable(
  'PDF_GENERATOR_API_URL',
  String,
  'http://localhost:5006',
)

export const CAMPAIGN_API_URL = getEnvVariable(
  'CAMPAIGN_API_URL',
  String,
  'http://localhost:5030',
)

export const LOCAL_AUTH_URL = getEnvVariable(
  'LOCAL_AUTH_URL',
  String,
  'http://localhost:9000/local-env-user',
)
