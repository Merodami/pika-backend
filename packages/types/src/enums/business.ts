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

/**
 * Business registration status
 */
export enum BusinessRegistrationStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Business registration steps
 */
export enum BusinessRegistrationStep {
  BASIC_INFO = 'basic_info',
  DETAILS = 'details',
  VERIFICATION = 'verification', // Future implementation
  COMPLETED = 'completed',
}

/**
 * Business registration current step numbers
 */
export const BUSINESS_REGISTRATION_STEPS = {
  BASIC_INFO: 1,
  DETAILS: 2,
  // VERIFICATION: 3, // Future implementation
} as const

export type BusinessRegistrationStepNumber =
  (typeof BUSINESS_REGISTRATION_STEPS)[keyof typeof BUSINESS_REGISTRATION_STEPS]
