import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

// Category service name
export const CATEGORY_SERVICE_NAME = getEnvVariable(
  'CATEGORY_SERVICE_NAME',
  String,
  'category_service',
)

// User service name
export const USER_SERVICE_NAME = getEnvVariable(
  'USER_SERVICE_NAME',
  String,
  'user_service',
)

// Notification service name
export const NOTIFICATION_SERVICE_NAME = getEnvVariable(
  'NOTIFICATION_SERVICE_NAME',
  String,
  'notification_service',
)

// Messaging service name
export const MESSAGING_SERVICE_NAME = getEnvVariable(
  'MESSAGING_SERVICE_NAME',
  String,
  'messaging_service',
)

// Voucher service name
export const VOUCHER_SERVICE_NAME = getEnvVariable(
  'VOUCHER_SERVICE_NAME',
  String,
  'voucher_service',
)

// Redemption service name
export const REDEMPTION_SERVICE_NAME = getEnvVariable(
  'REDEMPTION_SERVICE_NAME',
  String,
  'redemption_service',
)

// Provider service name (future service)
export const PROVIDER_SERVICE_NAME = getEnvVariable(
  'PROVIDER_SERVICE_NAME',
  String,
  'provider_service',
)

// Category service port
export const CATEGORY_SERVER_PORT = getEnvVariable(
  'CATEGORY_SERVER_PORT',
  Number,
  5020,
)

// User service port
export const USER_SERVER_PORT = getEnvVariable(
  'USER_SERVER_PORT',
  parseNumber,
  5022,
)

// Notification service port
export const NOTIFICATION_SERVER_PORT = getEnvVariable(
  'NOTIFICATION_SERVER_PORT',
  Number,
  5023,
)

// Messaging service port
export const MESSAGING_SERVER_PORT = getEnvVariable(
  'MESSAGING_SERVER_PORT',
  Number,
  5024,
)

// Voucher service port
export const VOUCHER_SERVER_PORT = getEnvVariable(
  'VOUCHER_SERVER_PORT',
  Number,
  5025,
)

// Redemption service port
export const REDEMPTION_SERVER_PORT = getEnvVariable(
  'REDEMPTION_SERVER_PORT',
  Number,
  5026,
)

// Provider service port (future service)
export const PROVIDER_SERVER_PORT = getEnvVariable(
  'PROVIDER_SERVER_PORT',
  Number,
  5027,
)

// Review service name
export const REVIEW_SERVICE_NAME = getEnvVariable(
  'REVIEW_SERVICE_NAME',
  String,
  'review_service',
)

// Review service port
export const REVIEW_SERVER_PORT = getEnvVariable(
  'REVIEW_SERVER_PORT',
  Number,
  5028,
)

// PDF Generator service name
export const PDF_GENERATOR_SERVICE_NAME = getEnvVariable(
  'PDF_GENERATOR_SERVICE_NAME',
  String,
  'pdf_generator_service',
)

// PDF Generator service port
export const PDF_GENERATOR_SERVER_PORT = getEnvVariable(
  'PDF_GENERATOR_SERVER_PORT',
  Number,
  5029,
)

// Campaign service name
export const CAMPAIGN_SERVICE_NAME = getEnvVariable(
  'CAMPAIGN_SERVICE_NAME',
  String,
  'campaign_service',
)

// Campaign service port
export const CAMPAIGN_SERVER_PORT = getEnvVariable(
  'CAMPAIGN_SERVER_PORT',
  Number,
  5030,
)

// Admin service name
export const ADMIN_SERVICE_NAME = getEnvVariable(
  'ADMIN_SERVICE_NAME',
  String,
  'admin_service',
)

// Admin service port
export const ADMIN_SERVER_PORT = getEnvVariable(
  'ADMIN_SERVER_PORT',
  Number,
  5031,
)

// Communication service name
export const COMMUNICATION_SERVICE_NAME = getEnvVariable(
  'COMMUNICATION_SERVICE_NAME',
  String,
  'communication_service',
)

// Communication service port
export const COMMUNICATION_SERVER_PORT = getEnvVariable(
  'COMMUNICATION_SERVER_PORT',
  Number,
  5032,
)
