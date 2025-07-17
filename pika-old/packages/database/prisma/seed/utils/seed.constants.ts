/**
 * Constants and configuration for seed operations
 */

import {
  SEED_ADMIN_USERS_COUNT,
  SEED_CUSTOMER_USERS_COUNT,
  SEED_PROVIDER_USERS_COUNT,
  SEED_ROOT_CATEGORIES_COUNT,
  SEED_SUB_CATEGORIES_COUNT} from '@pika/environment'

/**
 * Default languages supported in multilingual content
 */
export const SUPPORTED_LANGUAGES = ['es', 'en', 'gn']

/**
 * Default Paraguay country code
 */
export const DEFAULT_COUNTRY = 'PY'

/**
 * Default currency - Paraguayan Guarani
 */
export const DEFAULT_CURRENCY = 'PYG'

/**
 * Seed configuration interface
 */
export interface SeedConfig {
  // User counts
  ADMIN_USERS_COUNT: number
  CUSTOMER_USERS_COUNT: number
  PROVIDER_USERS_COUNT: number

  // Category counts
  ROOT_CATEGORIES_COUNT: number
  SUB_CATEGORIES_COUNT: number

}

/**
 * Default seeder configuration values
 * These can be overridden by environment variables
 */
export const DEFAULT_SEED_CONFIG: SeedConfig = {
  // User counts
  ADMIN_USERS_COUNT: 2,
  CUSTOMER_USERS_COUNT: 30,
  PROVIDER_USERS_COUNT: 10,

  // Category counts
  ROOT_CATEGORIES_COUNT: 8,
  SUB_CATEGORIES_COUNT: 24,

}

/**
 * Get seed configuration with environment variable overrides
 */
export function getSeedConfig(): SeedConfig {
  return {
    // User counts
    ADMIN_USERS_COUNT: SEED_ADMIN_USERS_COUNT,
    CUSTOMER_USERS_COUNT: SEED_CUSTOMER_USERS_COUNT,
    PROVIDER_USERS_COUNT: SEED_PROVIDER_USERS_COUNT,

    // Category counts
    ROOT_CATEGORIES_COUNT: SEED_ROOT_CATEGORIES_COUNT,
    SUB_CATEGORIES_COUNT: SEED_SUB_CATEGORIES_COUNT,

  }
}