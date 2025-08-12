/**
 * Business related enums
 */

/**
 * Business verification status
 */
export enum BusinessVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/**
 * Business types
 */
export enum BusinessType {
  RETAIL = 'retail',
  SERVICE = 'service',
  RESTAURANT = 'restaurant',
  HEALTHCARE = 'healthcare',
  FITNESS = 'fitness',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

/**
 * Business size categories
 */
export enum BusinessSize {
  SOLO = 'solo',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}
