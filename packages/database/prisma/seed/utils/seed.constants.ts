/**
 * Constants and configuration for seed operations
 */

import {
    SEED_ADMIN_USERS_COUNT
} from '@pika/environment'


/**
 * Default country code
 */
export const DEFAULT_COUNTRY = 'US'

/**
 * Default currency - US Dollar
 */
export const DEFAULT_CURRENCY = 'USD'

/**
 * Seed configuration interface
 */
export interface SeedConfig {
  // User counts
  ADMIN_USERS_COUNT: number
}

/**
 * Default seeder configuration values
 * These can be overridden by environment variables
 */
export const DEFAULT_SEED_CONFIG: SeedConfig = {
  // User counts
  ADMIN_USERS_COUNT: 2,
}

/**
 * Get seed configuration with environment variable overrides
 */
export function getSeedConfig(): SeedConfig {
  return {
    // User counts
    ADMIN_USERS_COUNT: SEED_ADMIN_USERS_COUNT,
  }
}