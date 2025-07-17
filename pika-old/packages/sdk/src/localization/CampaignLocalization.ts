import { LocalizationConfig } from '@pika/types-core'

import { Campaign } from '../openapi/models/Campaign.js'

/**
 * Localization configuration for Campaign entities
 * Specifies which fields contain multilingual content
 */
export const campaignLocalizationConfig: LocalizationConfig<Campaign> = {
  // Fields containing multilingual content
  multilingualFields: ['name', 'description', 'target_audience', 'objectives'],

  // No recursive fields for campaigns at this time
  recursiveFields: [],
}

/**
 * Localization configuration for other campaign-related entities can be added here
 */
