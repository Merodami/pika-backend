import { getEnvVariable } from '../getEnvVariable.js'

/**
 * Deep Link Configuration Constants
 * Used across all services for QR generation, scanning, and deep linking
 */

// Domain Configuration
export const DEEP_LINK_DOMAIN_PROD = getEnvVariable(
  'DEEP_LINK_DOMAIN_PROD',
  String,
  'https://app.thevoucherbook.com',
)

export const DEEP_LINK_DOMAIN_DEV = getEnvVariable(
  'DEEP_LINK_DOMAIN_DEV',
  String,
  'https://dev.app.thevoucherbook.com',
)

export const DEEP_LINK_DOMAIN_LOCAL = getEnvVariable(
  'DEEP_LINK_DOMAIN_LOCAL',
  String,
  'http://localhost:3000',
)

// URL Scheme Configuration
export const DEEP_LINK_SCHEME = getEnvVariable(
  'DEEP_LINK_SCHEME',
  String,
  'voucherbook',
)

// App Store Configuration
export const IOS_APP_STORE_ID = getEnvVariable(
  'IOS_APP_STORE_ID',
  String,
  '', // Empty until app is published
)

export const ANDROID_PACKAGE_ID = getEnvVariable(
  'ANDROID_PACKAGE_ID',
  String,
  'com.voucherbook.app',
)

// QR Code Mode Configuration
export const QR_CODE_DEFAULT_MODE = getEnvVariable(
  'QR_CODE_DEFAULT_MODE',
  String,
  'universal_link', // 'universal_link' | 'custom_scheme' (jwt mode removed)
)

export const QR_CODE_HYBRID_MODE_ENABLED = getEnvVariable(
  'QR_CODE_HYBRID_MODE_ENABLED',
  Boolean,
  false,
)

// Analytics Configuration
export const DEEP_LINK_ANALYTICS_ENABLED = getEnvVariable(
  'DEEP_LINK_ANALYTICS_ENABLED',
  Boolean,
  true,
)

// Deep Link Path Prefixes
export const DEEP_LINK_VOUCHER_PATH = '/voucher'
export const DEEP_LINK_BUSINESS_PATH = '/business'
export const DEEP_LINK_CATEGORY_PATH = '/category'
export const DEEP_LINK_DOWNLOAD_PATH = '/download'
export const DEEP_LINK_USER_PATH = '/user'
export const DEEP_LINK_EVENT_PATH = '/event'
