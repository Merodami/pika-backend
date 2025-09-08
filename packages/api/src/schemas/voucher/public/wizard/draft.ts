import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'
import { withTimestampsString } from '../../../shared/metadata.js'
import { DateTime, UUID } from '../../../shared/primitives.js'

/**
 * Voucher wizard draft management schemas
 */

/**
 * Draft initialization request (raw Zod)
 */
export const InitializeDraftRequest = z.object({
  businessId: UUID.optional().describe('Pre-select business if provided'),
  categoryId: UUID.optional().describe('Pre-select category if provided'),
})

/**
 * Draft initialization request (OpenAPI documented)
 */
export const InitializeDraftRequestSchema = openapi(InitializeDraftRequest, {
  description: 'Request to initialize a new voucher draft',
})

export type InitializeDraftRequestType = z.infer<typeof InitializeDraftRequest>

/**
 * Draft initialization response (raw Zod)
 */
export const InitializeDraftResponse = withTimestampsString({
  draftId: z.string().describe('Unique draft identifier'),
  sessionToken: z.string().describe('Session token for subsequent requests'),
  businessId: UUID.nullable(),
  currentStep: z.number().int().min(1).max(6),
  expiresAt: DateTime,
  qrCode: z.string().describe('Pre-reserved QR code'),
})

/**
 * Draft initialization response (OpenAPI documented)
 */
export const InitializeDraftResponseSchema = openapi(InitializeDraftResponse, {
  description: 'Response after initializing a voucher draft',
})

export type InitializeDraftResponseType = z.infer<
  typeof InitializeDraftResponse
>

/**
 * Draft state response (raw Zod)
 */
export const DraftStateResponse = withTimestampsString({
  draftId: z.string(),
  businessId: UUID,
  userId: UUID,
  currentStep: z.number().int().min(1).max(6),
  completedSteps: z.array(z.number().int()),
  isComplete: z.boolean(),

  // Step data (only populated steps are returned)
  step1Data: z.record(z.string(), z.any()).nullable(),
  step2Data: z.record(z.string(), z.any()).nullable(),
  step3Data: z.record(z.string(), z.any()).nullable(),
  step4Data: z.record(z.string(), z.any()).nullable(),
  step5Data: z.record(z.string(), z.any()).nullable(),

  // Pre-generated values
  qrCode: z.string().nullable(),
  titleKey: z.string().nullable(),
  descriptionKey: z.string().nullable(),
  termsAndConditionsKey: z.string().nullable(),

  // Validation state
  validationErrors: z.record(z.string(), z.array(z.string())).nullable(),
  lastValidatedAt: DateTime.nullable(),

  // Session info
  sessionToken: z.string().nullable(),
  expiresAt: DateTime,

  // Completion info
  completedAt: DateTime.nullable(),
  voucherId: UUID.nullable(),
})

/**
 * Draft state response (OpenAPI documented)
 */
export const DraftStateResponseSchema = openapi(DraftStateResponse, {
  description: 'Complete draft state information',
})

export type DraftStateResponse = z.infer<typeof DraftStateResponse>

/**
 * List drafts response (raw Zod)
 */
export const ListDraftsResponse = z.object({
  drafts: z.array(
    z.object({
      draftId: z.string(),
      businessId: UUID,
      businessName: z.string().optional(),
      currentStep: z.number().int(),
      completedSteps: z.array(z.number().int()),
      isComplete: z.boolean(),
      expiresAt: DateTime,
      createdAt: DateTime,
      updatedAt: DateTime,
    }),
  ),
  total: z.number().int(),
})

/**
 * List drafts response (OpenAPI documented)
 */
export const ListDraftsResponseSchema = openapi(ListDraftsResponse, {
  description: 'List of voucher drafts',
})

export type ListDraftsResponse = z.infer<typeof ListDraftsResponse>

/**
 * Draft completion request (raw Zod)
 */
export const CompleteDraftRequest = z.object({
  publishImmediately: z
    .boolean()
    .default(false)
    .describe('Publish voucher immediately after creation'),
  scheduledPublishDate: DateTime.optional().describe(
    'Schedule publication for future date',
  ),
})

/**
 * Draft completion request (OpenAPI documented)
 */
export const CompleteDraftRequestSchema = openapi(CompleteDraftRequest, {
  description: 'Request to complete draft and create voucher',
})

export type CompleteDraftRequest = z.infer<typeof CompleteDraftRequest>

/**
 * Draft completion response (raw Zod)
 */
export const CompleteDraftResponse = z.object({
  success: z.boolean(),
  voucherId: UUID,
  voucher: z.record(z.string(), z.any()).describe('Created voucher object'),
  publishStatus: z.enum(['draft', 'published', 'scheduled']),
})

/**
 * Draft completion response (OpenAPI documented)
 */
export const CompleteDraftResponseSchema = openapi(CompleteDraftResponse, {
  description: 'Response after completing draft and creating voucher',
})

export type CompleteDraftResponse = z.infer<typeof CompleteDraftResponse>

/**
 * Delete draft response (raw Zod)
 */
export const DeleteDraftResponse = z.object({
  success: z.boolean(),
  message: z.string(),
})

/**
 * Delete draft response (OpenAPI documented)
 */
export const DeleteDraftResponseSchema = openapi(DeleteDraftResponse, {
  description: 'Response after deleting a draft',
})

export type DeleteDraftResponse = z.infer<typeof DeleteDraftResponse>
