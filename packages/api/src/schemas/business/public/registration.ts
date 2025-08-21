/**
 * Business Registration API Schemas
 *
 * Public endpoints for business registration flow
 */

import { BusinessType as BusinessTypeEnum, FIELD_LENGTH } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { withTimestampsString } from '../../shared/metadata.js'
import {
  EmailString,
  LanguageCode,
  PhoneNumber,
  UUID,
} from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import {
  BUSINESS_REGISTRATION_RELATIONS,
  BusinessRegistrationStatus,
  REGISTRATION_STEP_NUMBERS,
} from '../common/enums.js'

// ============= Registration Status =============

/**
 * Business registration status response (raw Zod)
 */
export const BusinessRegistrationStatusResponse = withTimestampsString({
  needsRegistration: z
    .boolean()
    .describe('Whether user needs to complete registration'),
  currentStep: z
    .number()
    .int()
    .min(0)
    .max(Object.keys(REGISTRATION_STEP_NUMBERS).length)
    .describe('Current registration step number'),
  registrationStatus: BusinessRegistrationStatus.describe(
    'Current registration status',
  ),
  canAccessDashboard: z.boolean().describe('Whether user can access dashboard'),
  registrationId: UUID.optional().describe('Registration ID if exists'),
  businessId: UUID.optional().describe('Business ID if created'),
})

/**
 * Business registration status response (OpenAPI documented)
 */
export const BusinessRegistrationStatusResponseSchema = openapi(
  BusinessRegistrationStatusResponse,
  {
    description: 'Business registration status information',
  },
)

export type BusinessRegistrationStatusResponse = z.infer<
  typeof BusinessRegistrationStatusResponse
>

// ============= Business Type Enum =============

const BusinessType = createZodEnum(BusinessTypeEnum)

// ============= Step 1 Request =============

/**
 * Business registration step 1 request (raw Zod)
 */
export const BusinessRegistrationStep1Request = z.object({
  businessName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.NAME_MAX)
    .describe('Business name'),
  businessType: BusinessType.describe('Type of business'),
  categoryId: UUID.describe('Category ID'),
  primaryLanguage: LanguageCode.describe('Primary language code'),
})

/**
 * Business registration step 1 request (OpenAPI documented)
 */
export const BusinessRegistrationStep1RequestSchema = openapi(
  BusinessRegistrationStep1Request,
  {
    description: 'Step 1 of business registration',
  },
)

export type BusinessRegistrationStep1Request = z.infer<
  typeof BusinessRegistrationStep1Request
>

// ============= Step 2 Request =============

/**
 * Business registration step 2 request (raw Zod)
 */
export const BusinessRegistrationStep2Request = z.object({
  description: z
    .string()
    .min(1)
    .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
    .describe('Business description'),
  address: z
    .object({
      street: z
        .string()
        .min(1)
        .max(FIELD_LENGTH.ADDRESS_LINE_MAX)
        .describe('Street address'),
      city: z.string().min(1).max(FIELD_LENGTH.CITY_MAX).describe('City'),
      state: z
        .string()
        .min(1)
        .max(FIELD_LENGTH.STATE_MAX)
        .describe('State/Province'),
      postalCode: z
        .string()
        .min(1)
        .max(FIELD_LENGTH.POSTAL_CODE_MAX)
        .describe('Postal code'),
      country: z
        .string()
        .length(FIELD_LENGTH.COUNTRY_CODE_LENGTH)
        .describe('Country code (ISO 3166-1 alpha-2)'),
    })
    .describe('Business address'),
  phone: PhoneNumber.describe('Business phone number'),
  website: z
    .string()
    .url()
    .max(FIELD_LENGTH.URL_MAX)
    .optional()
    .describe('Business website URL'),
  email: EmailString.optional().describe('Business contact email'),
})

/**
 * Business registration step 2 request (OpenAPI documented)
 */
export const BusinessRegistrationStep2RequestSchema = openapi(
  BusinessRegistrationStep2Request,
  {
    description: 'Step 2 of business registration',
  },
)

export type BusinessRegistrationStep2Request = z.infer<
  typeof BusinessRegistrationStep2Request
>

// ============= Step 3 Request =============

/**
 * Business registration step 3 request (raw Zod)
 */
export const BusinessRegistrationStep3Request = z.object({
  operatingHours: z
    .record(z.string(), z.any())
    .optional()
    .describe('Operating hours'),
  socialMedia: z
    .record(z.string(), z.string())
    .optional()
    .describe('Social media links'),
  additionalInfo: z
    .record(z.string(), z.any())
    .optional()
    .describe('Additional information'),
})

/**
 * Business registration step 3 request (OpenAPI documented)
 */
export const BusinessRegistrationStep3RequestSchema = openapi(
  BusinessRegistrationStep3Request,
  {
    description: 'Step 3 of business registration',
  },
)

export type BusinessRegistrationStep3Request = z.infer<
  typeof BusinessRegistrationStep3Request
>

// ============= Step Submission =============

/**
 * Submit registration step request (raw Zod)
 */
export const SubmitRegistrationStepRequest = z.object({
  stepNumber: z
    .number()
    .int()
    .min(1)
    .max(Object.keys(REGISTRATION_STEP_NUMBERS).length)
    .describe('Step number to submit'),
  stepData: z.record(z.string(), z.any()),
  saveAsDraft: z
    .boolean()
    .default(false)
    .describe('Save as draft without validation'),
})

/**
 * Submit registration step request (OpenAPI documented)
 */
export const SubmitRegistrationStepRequestSchema = openapi(
  SubmitRegistrationStepRequest,
  {
    description: 'Submit a registration step',
  },
)

export type SubmitRegistrationStepRequest = z.infer<
  typeof SubmitRegistrationStepRequest
>

/**
 * Submit registration step response (raw Zod)
 */
export const SubmitRegistrationStepResponse = z.object({
  success: z.boolean().describe('Whether step was saved successfully'),
  nextStep: z
    .number()
    .int()
    .nullable()
    .describe('Next step number or null if complete'),
  savedData: z.record(z.string(), z.any()).optional(),
})

/**
 * Submit registration step response (OpenAPI documented)
 */
export const SubmitRegistrationStepResponseSchema = openapi(
  SubmitRegistrationStepResponse,
  {
    description: 'Step submission result',
  },
)

export type SubmitRegistrationStepResponse = z.infer<
  typeof SubmitRegistrationStepResponse
>

// ============= Registration Progress =============

/**
 * Registration progress response (raw Zod)
 */
export const RegistrationProgressResponse = withTimestampsString({
  id: UUID.describe('Registration ID'),
  userId: UUID.describe('User ID'),
  currentStep: z.number().int().describe('Current step number'),
  stepsCompleted: z
    .array(z.number().int())
    .describe('List of completed step numbers'),
  step1Data: z.record(z.string(), z.any()).optional(),
  step2Data: z.record(z.string(), z.any()).optional(),
  step3Data: z.record(z.string(), z.any()).optional(),
  registrationStatus: BusinessRegistrationStatus.describe(
    'Current registration status',
  ),
  businessId: UUID.optional().describe('Business ID if created'),
})

/**
 * Registration progress response (OpenAPI documented)
 */
export const RegistrationProgressResponseSchema = openapi(
  RegistrationProgressResponse,
  {
    description: 'Current registration progress',
  },
)

export type RegistrationProgressResponse = z.infer<
  typeof RegistrationProgressResponse
>

// ============= Complete Registration =============

/**
 * Complete registration request (raw Zod)
 */
export const CompleteBusinessRegistrationRequest = z.object({
  confirmAllDataAccurate: z
    .literal(true)
    .describe('Confirm all data is accurate'),
  agreedToTerms: z.literal(true).describe('Agree to terms and conditions'),
})

/**
 * Complete registration request (OpenAPI documented)
 */
export const CompleteBusinessRegistrationRequestSchema = openapi(
  CompleteBusinessRegistrationRequest,
  {
    description: 'Complete business registration',
  },
)

export type CompleteBusinessRegistrationRequest = z.infer<
  typeof CompleteBusinessRegistrationRequest
>

/**
 * Complete registration response (raw Zod)
 */
export const CompleteBusinessRegistrationResponse = z.object({
  businessId: UUID.describe('Newly created business ID'),
  registrationStatus: z.literal('submitted').describe('Registration status'),
  message: z.string().describe('Success message'),
  estimatedReviewTime: z.string().describe('Estimated review time'),
})

/**
 * Complete registration response (OpenAPI documented)
 */
export const CompleteBusinessRegistrationResponseSchema = openapi(
  CompleteBusinessRegistrationResponse,
  {
    description: 'Registration completion result',
  },
)

export type CompleteBusinessRegistrationResponse = z.infer<
  typeof CompleteBusinessRegistrationResponse
>

// ============= Query Parameters =============

/**
 * Registration detail query parameters (raw Zod)
 */
export const RegistrationDetailQueryParams = createIncludeParam(
  BUSINESS_REGISTRATION_RELATIONS,
)

/**
 * Registration detail query parameters (OpenAPI documented)
 */
export const RegistrationDetailQueryParamsSchema = openapi(
  RegistrationDetailQueryParams,
  {
    description: 'Query parameters for registration details',
  },
)

export type RegistrationDetailQueryParams = z.infer<
  typeof RegistrationDetailQueryParams
>
