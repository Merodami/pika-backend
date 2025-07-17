import { LocalizationConfig } from '@pika/types-core'

import { Category } from '../openapi/models/Category.js'

/**
 * Localization configuration for Category entities
 * Specifies which fields contain multilingual content
 */
export const categoryLocalizationConfig: LocalizationConfig<Category> = {
  // Fields containing multilingual content
  multilingualFields: ['name', 'description'],

  // Define recursive fields that should also be processed
  recursiveFields: [
    {
      field: 'children',
      config: {
        multilingualFields: ['name', 'description'],
        recursiveFields: [], // Recursive structure can go deeper if needed
      },
    },
  ],
}

/**
 * Localization configuration for other category-related entities can be added here
 */
