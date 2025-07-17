import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Physical Activity Readiness Questionnaire (PAR-Q) schemas
 */

// ============= PARQ Questions =============

/**
 * Standard PAR-Q+ questions
 */
export const PARQQuestions = z.object({
  // Standard PAR-Q questions
  heartCondition: z
    .boolean()
    .describe('Has your doctor ever said you have a heart condition?'),
  chestPain: z
    .boolean()
    .describe('Do you feel pain in your chest when you do physical activity?'),
  chestPainAtRest: z
    .boolean()
    .describe('Have you had chest pain when not doing physical activity?'),
  dizziness: z.boolean().describe('Do you lose balance due to dizziness?'),
  boneJointProblem: z.boolean().describe('Do you have bone or joint problems?'),
  bloodPressureMedication: z
    .boolean()
    .describe('Are you currently taking blood pressure medication?'),
  otherReason: z
    .boolean()
    .describe('Any other reason you should not do physical activity?'),

  // Additional health questions
  pregnant: z
    .boolean()
    .optional()
    .describe('Are you pregnant or have you given birth in the last 6 months?'),
  diabetes: z.boolean().optional().describe('Do you have diabetes?'),
  asthma: z
    .boolean()
    .optional()
    .describe('Do you have asthma or breathing difficulties?'),
})

export type PARQQuestions = z.infer<typeof PARQQuestions>

// ============= PARQ Submission =============

/**
 * PAR-Q questionnaire submission
 */
export const PARQSubmission = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,

    // Questionnaire responses
    responses: PARQQuestions,

    // Risk assessment
    hasPositiveResponse: z.boolean().describe('Any "yes" answers'),
    riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH']),
    requiresMedicalClearance: z.boolean(),

    // Additional information
    additionalNotes: z.string().max(1000).optional(),
    medications: z.array(z.string()).default([]),
    injuries: z.array(z.string()).default([]),

    // Medical clearance
    medicalClearanceProvided: z.boolean().default(false),
    medicalClearanceDate: DateTime.optional(),
    medicalClearanceDocument: z.string().url().optional(),
    physicianName: z.string().optional(),
    physicianContact: z.string().optional(),

    // Validity
    expiresAt: DateTime.describe('PAR-Q typically valid for 12 months'),

    // Consent
    consentGiven: z.boolean(),
    consentDate: DateTime,
    ipAddress: z.string().optional(),
  }),
  {
    description: 'PAR-Q questionnaire submission',
  },
)

export type PARQSubmission = z.infer<typeof PARQSubmission>

// ============= Submit PARQ =============

/**
 * Submit PAR-Q request
 */
export const SubmitPARQRequest = openapi(
  z.object({
    responses: PARQQuestions,
    additionalNotes: z.string().max(1000).optional(),
    medications: z.array(z.string()).optional(),
    injuries: z.array(z.string()).optional(),
    consentGiven: z.boolean(),
  }),
  {
    description: 'Submit PAR-Q questionnaire',
  },
)

export type SubmitPARQRequest = z.infer<typeof SubmitPARQRequest>

// ============= Medical Clearance =============

/**
 * Submit medical clearance request
 */
export const SubmitMedicalClearanceRequest = openapi(
  z.object({
    documentUrl: z.string().url(),
    physicianName: z.string().max(200),
    physicianContact: z.string().max(200).optional(),
    clearanceDate: DateTime,
    notes: z.string().max(1000).optional(),
  }),
  {
    description: 'Submit medical clearance for PAR-Q',
  },
)

export type SubmitMedicalClearanceRequest = z.infer<
  typeof SubmitMedicalClearanceRequest
>

// ============= PARQ Status =============

/**
 * User PAR-Q status
 */
export const PARQStatus = openapi(
  z.object({
    hasValidPARQ: z.boolean(),
    parqId: UUID.optional(),
    submittedAt: DateTime.optional(),
    expiresAt: DateTime.optional(),
    requiresMedicalClearance: z.boolean(),
    medicalClearanceProvided: z.boolean(),
    riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
    canBookSessions: z.boolean(),
    blockedReason: z.string().optional(),
  }),
  {
    description: 'User PAR-Q status summary',
  },
)

export type PARQStatus = z.infer<typeof PARQStatus>

// ============= Emergency Contact =============

/**
 * Emergency contact information
 */
export const EmergencyContact = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    name: z.string().max(200),
    relationship: z.string().max(100),
    phoneNumber: z.string().max(50),
    alternatePhone: z.string().max(50).optional(),
    email: z.string().email().optional(),
    isPrimary: z.boolean().default(true),
  }),
  {
    description: 'Emergency contact information',
  },
)

export type EmergencyContact = z.infer<typeof EmergencyContact>

/**
 * Add emergency contact request
 */
export const AddEmergencyContactRequest = openapi(
  z.object({
    name: z.string().max(200),
    relationship: z.string().max(100),
    phoneNumber: z.string().max(50),
    alternatePhone: z.string().max(50).optional(),
    email: z.string().email().optional(),
    isPrimary: z.boolean().optional(),
  }),
  {
    description: 'Add emergency contact',
  },
)

export type AddEmergencyContactRequest = z.infer<
  typeof AddEmergencyContactRequest
>

// ============= Missing Response Schemas =============

/**
 * Single PARQ response
 */
export const PARQResponse = openapi(PARQSubmission, {
  description: 'Single PAR-Q submission details',
})

export type PARQResponse = z.infer<typeof PARQResponse>

/**
 * Create PARQ request (alias for submit)
 */
export const CreatePARQRequest = SubmitPARQRequest

export type CreatePARQRequest = z.infer<typeof CreatePARQRequest>

/**
 * Update PARQ request
 */
export const UpdatePARQRequest = openapi(
  z.object({
    responses: PARQQuestions.optional(),
    additionalNotes: z.string().max(1000).optional(),
    medications: z.array(z.string()).optional(),
    injuries: z.array(z.string()).optional(),
    medicalClearanceProvided: z.boolean().optional(),
    medicalClearanceDate: DateTime.optional(),
    medicalClearanceDocument: z.string().url().optional(),
    physicianName: z.string().optional(),
    physicianContact: z.string().optional(),
  }),
  {
    description: 'Update PAR-Q submission',
  },
)

export type UpdatePARQRequest = z.infer<typeof UpdatePARQRequest>
