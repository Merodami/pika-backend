import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Professional trainer profile schemas
 */

// ============= Enums =============

export const CertificationType = z.enum([
  'PERSONAL_TRAINER',
  'FITNESS_INSTRUCTOR',
  'YOGA',
  'PILATES',
  'NUTRITION',
  'FIRST_AID',
  'OTHER',
])
export type CertificationType = z.infer<typeof CertificationType>

export const SpecializationType = z.enum([
  'WEIGHT_LOSS',
  'MUSCLE_GAIN',
  'STRENGTH_TRAINING',
  'ENDURANCE',
  'REHABILITATION',
  'SPORTS_PERFORMANCE',
  'SENIOR_FITNESS',
  'YOUTH_FITNESS',
  'PRE_POSTNATAL',
  'NUTRITION',
  'WELLNESS',
  'OTHER',
])
export type SpecializationType = z.infer<typeof SpecializationType>

// ============= Professional Profile =============

/**
 * Professional trainer profile
 */
export const ProfessionalProfile = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,

    // Basic Professional info - matching current database
    description: z.string().describe('Professional description'),
    specialties: z.array(z.string()).default([]).describe('Areas of expertise'),
    favoriteGyms: z.array(z.string()).default([]).describe('Favorite gym IDs'),

    // TODO: Future enhancements (currently commented out)
    // Professional info
    // title: z.string().max(100).optional().describe('Professional title'),
    // bio: z.string().max(2000).describe('Professional bio'),
    // yearsOfExperience: z.number().int().nonnegative(),

    // Specializations
    // specializations: z.array(SpecializationType).default([]),
    // customSpecializations: z.array(z.string()).default([]),

    // Availability
    // availableForPersonalTraining: z.boolean().default(true),
    // availableForGroupClasses: z.boolean().default(true),
    // availableForOnlineCoaching: z.boolean().default(false),

    // Rates
    // hourlyRate: z
    //   .number()
    //   .nonnegative()
    //   .optional()
    //   .describe('Hourly rate in cents'),
    // currency: z.string().length(3).default('USD'),

    // Media
    // profileVideo: z.string().url().optional(),
    // gallery: z.array(z.string().url()).max(10).default([]),

    // Settings
    // isPublic: z.boolean().default(true),
    // acceptsNewClients: z.boolean().default(true),
  }),
  {
    description: 'Professional trainer profile',
  },
)

export type ProfessionalProfile = z.infer<typeof ProfessionalProfile>

// ============= Certifications =============

/**
 * Professional certification
 */
export const Certification = openapi(
  z.object({
    id: UUID,
    type: CertificationType,
    name: z.string().max(200),
    issuingOrganization: z.string().max(200),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    certificateNumber: z.string().optional(),
    documentUrl: z.string().url().optional(),
    verified: z.boolean().default(false),
    verifiedAt: DateTime.optional(),
  }),
  {
    description: 'Professional certification',
  },
)

export type Certification = z.infer<typeof Certification>

// ============= Create/Update Professional =============

/**
 * Create professional profile request
 */
export const CreateProfessionalProfileRequest = openapi(
  z.object({
    description: z.string().describe('Professional description'),
    specialties: z.array(z.string()).optional().describe('Areas of expertise'),
    favoriteGyms: z.array(z.string()).optional().describe('Favorite gym IDs'),

    // TODO: Future enhancements
    // title: z.string().max(100).optional(),
    // bio: z.string().max(2000),
    // yearsOfExperience: z.number().int().nonnegative(),
    // specializations: z.array(SpecializationType).optional(),
    // customSpecializations: z.array(z.string()).optional(),
    // availableForPersonalTraining: z.boolean().optional(),
    // availableForGroupClasses: z.boolean().optional(),
    // availableForOnlineCoaching: z.boolean().optional(),
    // hourlyRate: z.number().nonnegative().optional(),
    // currency: z.string().length(3).optional(),
  }),
  {
    description: 'Create professional trainer profile',
  },
)

export type CreateProfessionalProfileRequest = z.infer<
  typeof CreateProfessionalProfileRequest
>

/**
 * Update professional profile request
 */
export const UpdateProfessionalProfileRequest =
  CreateProfessionalProfileRequest.partial()

export type UpdateProfessionalProfileRequest = z.infer<
  typeof UpdateProfessionalProfileRequest
>

// ============= Certification Management =============

/**
 * Add certification request
 */
export const AddCertificationRequest = openapi(
  z.object({
    type: CertificationType,
    name: z.string().max(200),
    issuingOrganization: z.string().max(200),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    certificateNumber: z.string().optional(),
    documentUrl: z.string().url().optional(),
  }),
  {
    description: 'Add professional certification',
  },
)

export type AddCertificationRequest = z.infer<typeof AddCertificationRequest>

// TODO: Future enhancement - Professional profile with certifications
// /**
//  * Professional profile with certifications
//  */
// export const ProfessionalProfileWithCertifications = ProfessionalProfile.extend(
//   {
//     certifications: z.array(Certification),
//     verifiedCertificationsCount: z.number().int().nonnegative(),
//   },
// )

// export type ProfessionalProfileWithCertifications = z.infer<
//   typeof ProfessionalProfileWithCertifications
// >
