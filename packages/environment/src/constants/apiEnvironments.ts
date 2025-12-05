import { getEnvVariable } from '../getEnvVariable.js'

/**
 * API Environment URLs
 * These are the base URLs for different API environments
 */

// ============= Production URLs =============
export const PRODUCTION_API_URL = getEnvVariable(
  'PRODUCTION_API_URL',
  String,
  'https://api.thevoucherbook.com/v1',
)

export const PRODUCTION_ADMIN_API_URL = getEnvVariable(
  'PRODUCTION_ADMIN_API_URL',
  String,
  'https://admin-api.thevoucherbook.com/v1',
)

export const PRODUCTION_INTERNAL_API_URL = getEnvVariable(
  'PRODUCTION_INTERNAL_API_URL',
  String,
  'https://internal-api.thevoucherbook.com/v1',
)

// ============= Staging URLs =============
export const STAGING_API_URL = getEnvVariable(
  'STAGING_API_URL',
  String,
  'https://api.staging.thevoucherbook.com/v1',
)

export const STAGING_ADMIN_API_URL = getEnvVariable(
  'STAGING_ADMIN_API_URL',
  String,
  'https://staging-admin-api.thevoucherbook.com/v1',
)

export const STAGING_INTERNAL_API_URL = getEnvVariable(
  'STAGING_INTERNAL_API_URL',
  String,
  'https://internal-api.staging.thevoucherbook.com/v1',
)

// ============= Development URLs =============
// Local development URLs are derived from API_GATEWAY_BASE_URL or service-specific ports
export { API_GATEWAY_BASE_URL as LOCAL_API_GATEWAY_URL } from './apiGateway.js'

// Helper to get the full API URL based on environment
export function getApiUrl(
  environment: 'production' | 'staging' | 'local',
): string {
  switch (environment) {
    case 'production':
      return PRODUCTION_API_URL
    case 'staging':
      return STAGING_API_URL
    case 'local':
    default:
      return `${getEnvVariable('API_GATEWAY_BASE_URL', String, 'http://localhost:5500')}/api/v1`
  }
}

export function getAdminApiUrl(
  environment: 'production' | 'staging' | 'local',
): string {
  switch (environment) {
    case 'production':
      return PRODUCTION_ADMIN_API_URL
    case 'staging':
      return STAGING_ADMIN_API_URL
    case 'local':
    default:
      return `${getEnvVariable('API_GATEWAY_BASE_URL', String, 'http://localhost:5500')}/api/v1`
  }
}

export function getInternalApiUrl(
  environment: 'production' | 'staging' | 'local',
): string {
  switch (environment) {
    case 'production':
      return PRODUCTION_INTERNAL_API_URL
    case 'staging':
      return STAGING_INTERNAL_API_URL
    case 'local':
    default:
      return `${getEnvVariable('API_GATEWAY_BASE_URL', String, 'http://localhost:5500')}/api/v1`
  }
}
