import { LocalizationConfig } from '@pika/types-core'

import { Voucher } from '../openapi/models/Voucher.js'

/**
 * Localization configuration for Voucher entities
 * Specifies which fields contain multilingual content
 */
export const voucherLocalizationConfig: LocalizationConfig<Voucher> = {
  // Fields containing multilingual content
  multilingualFields: ['title', 'description', 'terms'],

  // No recursive fields for vouchers
  recursiveFields: [],
}

/**
 * Localization configuration for other voucher-related entities can be added here
 */
