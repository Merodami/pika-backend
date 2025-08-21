/**
 * Frontend Business Registration Schemas
 *
 * Multi-step registration flow for business owners
 * Architecture: Backend Schema → .extend() → Frontend Schema
 */

import { BusinessType, FIELD_LENGTH } from '@pika/types'
import { z } from 'zod'

import { Email, URL } from '../../shared/branded.js'
import { Address } from '../../shared/geo.js'
import { LanguageCode, PhoneNumber, UUID } from '../../shared/primitives.js'

// ============= Step 1: Basic Business Information =============

/**
 * First step of business registration - basic information
 */
export const BusinessRegistrationStep1Schema = z.object({
  businessName: z
    .string()
    .min(
      FIELD_LENGTH.NAME_MIN,
      `Business name must be at least ${FIELD_LENGTH.NAME_MIN} characters`,
    )
    .max(
      FIELD_LENGTH.NAME_MAX,
      `Business name must not exceed ${FIELD_LENGTH.NAME_MAX} characters`,
    ),
  businessType: z.nativeEnum(BusinessType).describe('Type of business'),
  categoryId: UUID.describe('Business category'),
  primaryLanguage: LanguageCode.describe('Primary business language'),
})

export type BusinessRegistrationStep1Data = z.infer<
  typeof BusinessRegistrationStep1Schema
>

// ============= Step 2: Business Details =============

/**
 * Second step of business registration - detailed information
 */
export const BusinessRegistrationStep2Schema = z.object({
  businessDescription: z
    .string()
    .max(
      FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX,
      `Description must not exceed ${FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX} characters`,
    )
    .optional()
    .describe('Business description'),
  businessAddress: Address.describe('Business physical address'),
  businessPhone: PhoneNumber.describe('Business contact phone'),
  businessEmail: Email.describe('Business contact email'),
  websiteUrl: URL.optional().describe('Business website'),
  socialMedia: z
    .object({
      facebook: z.string().url('Invalid Facebook URL').optional(),
      instagram: z.string().optional().describe('Instagram handle without @'),
      linkedin: z.string().url('Invalid LinkedIn URL').optional(),
    })
    .optional()
    .describe('Social media profiles'),
})

export type BusinessRegistrationStep2Data = z.infer<
  typeof BusinessRegistrationStep2Schema
>

// ============= Step 3: Verification & Documents (FUTURE) =============

/**
 * Third step - verification and documents
 * NOTE: Not implemented in Phase 1
 * Will require new database tables: business_verification and business_bank_account
 * These fields will be used for manual business updates in admin panel
 */
/*
export const BusinessRegistrationStep3Schema = z.object({
  // Verification fields
  taxId: z.string().min(1, 'Tax ID is required'),
  businessRegistrationNumber: z.string().min(1, 'Business registration number is required'),

  // Bank account information
  bankAccount: z.object({
    accountName: z.string().min(1, 'Account name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    swiftCode: z.string().optional(),
  }),

  // Document uploads
  documents: z.object({
    businessLicense: FileUploadSchema,
    taxCertificate: FileUploadSchema.optional(),
    bankStatement: FileUploadSchema.optional(),
  })
})

export type BusinessRegistrationStep3Data = z.infer<typeof BusinessRegistrationStep3Schema>
*/

// ============= Combined Registration Schema =============

/**
 * Complete registration data combining all steps
 * Phase 1: Only includes steps 1 and 2
 */
export const BusinessRegistrationCompleteSchema = z.object({
  step1: BusinessRegistrationStep1Schema,
  step2: BusinessRegistrationStep2Schema,
  // step3: BusinessRegistrationStep3Schema, // FUTURE
  agreedToTerms: z.literal(true).describe('User must agree to terms'),
  agreedToProcessingFees: z
    .literal(true)
    .describe('User must agree to processing fees'),
})

export type BusinessRegistrationCompleteData = z.infer<
  typeof BusinessRegistrationCompleteSchema
>
