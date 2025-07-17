import { LocalizationConfig } from '@pika/types-core'

import { Admin } from '../openapi/models/Admin.js'

/**
 * Localization configuration for Admin entities
 * Specifies which fields contain multilingual content
 */
export const adminLocalizationConfig: LocalizationConfig<Admin> = {
  // Fields containing multilingual content within profile_data
  multilingualFields: ['profile_data.bio'],

  // No recursive fields for Admin entities
  recursiveFields: [],
}

/**
 * Localization configuration for other admin-related entities can be added here
 */
