import { z } from 'zod'

import { GymId, UserId } from '../../../common/schemas/branded.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { SearchParams } from '../../../common/schemas/pagination.js'
import { DateOnly, DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Gym induction/onboarding schemas for public API
 */

// ============= Enums =============

export const InductionStatus = z.enum([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
])
export type InductionStatus = z.infer<typeof InductionStatus>

// ============= Induction Schema =============

/**
 * Gym induction appointment
 */
export const Induction = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    gymId: GymId,
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('Induction date (YYYY-MM-DD)'),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .describe('Start time (HH:MM)'),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .describe('End time (HH:MM)'),
    status: InductionStatus,

    // Trainer assignment
    trainerId: UserId.optional().describe('Assigned trainer for the induction'),

    // Details
    notes: z.string().max(1000).optional().describe('Additional notes'),
    completedAt: DateTime.optional(),
    cancelledAt: DateTime.optional(),
    cancellationReason: z.string().optional(),

    // Metadata
    reminderSent: z.boolean().default(false),
    followUpRequired: z.boolean().default(false),
  }),
  {
    description: 'Gym induction appointment',
  },
)

export type Induction = z.infer<typeof Induction>

// ============= Create Induction =============

/**
 * Create induction request
 */
export const CreateInductionRequest = openapi(
  z.object({
    gymId: GymId,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    notes: z.string().max(1000).optional(),
  }),
  {
    description: 'Schedule a gym induction',
  },
)

export type CreateInductionRequest = z.infer<typeof CreateInductionRequest>

// ============= Update Induction =============

/**
 * Update induction status request
 */
export const UpdateInductionStatusRequest = openapi(
  z.object({
    status: InductionStatus,
    notes: z.string().max(1000).optional(),
    cancellationReason: z
      .string()
      .max(500)
      .optional()
      .describe('Required for CANCELLED status'),
  }),
  {
    description: 'Update induction status',
  },
)

export type UpdateInductionStatusRequest = z.infer<
  typeof UpdateInductionStatusRequest
>

/**
 * Reschedule induction request
 */
export const RescheduleInductionRequest = openapi(
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    reason: z.string().max(500).optional(),
  }),
  {
    description: 'Reschedule an induction',
  },
)

export type RescheduleInductionRequest = z.infer<
  typeof RescheduleInductionRequest
>

// ============= Search Inductions =============

/**
 * Induction search parameters
 */
export const InductionSearchParams = SearchParams.extend({
  userId: UserId.optional(),
  gymId: GymId.optional(),
  trainerId: UserId.optional(),
  status: InductionStatus.optional(),
  date: DateOnly.optional(),
  fromDate: DateOnly.optional(),
  toDate: DateOnly.optional(),
  sortBy: z.enum(['DATE', 'CREATED_AT', 'STATUS']).default('DATE'),
})

export type InductionSearchParams = z.infer<typeof InductionSearchParams>

/**
 * Induction list response
 */
export const InductionListResponse = paginatedResponse(Induction)

export type InductionListResponse = z.infer<typeof InductionListResponse>

// ============= Induction Details =============

/**
 * Induction with related data
 */
export const InductionDetails = Induction.extend({
  user: z.object({
    id: UserId,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
  }),
  gym: z.object({
    id: GymId,
    name: z.string(),
    address: z.string(),
    phoneNumber: z.string(),
  }),
  trainer: z
    .object({
      id: UserId,
      firstName: z.string(),
      lastName: z.string(),
      profileImage: z.string().url().optional(),
    })
    .optional(),
})

export type InductionDetails = z.infer<typeof InductionDetails>

// ============= Bulk Operations =============

/**
 * Bulk induction status update
 */
export const BulkInductionStatusUpdateRequest = openapi(
  z.object({
    inductionIds: z.array(UUID).min(1).max(50),
    status: InductionStatus,
    notes: z.string().max(1000).optional(),
  }),
  {
    description: 'Update multiple induction statuses',
  },
)

export type BulkInductionStatusUpdateRequest = z.infer<
  typeof BulkInductionStatusUpdateRequest
>

// ============= Available Slots =============

/**
 * Available induction slot
 */
export const InductionSlot = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  trainerId: UserId.optional(),
  available: z.boolean(),
})

export type InductionSlot = z.infer<typeof InductionSlot>

/**
 * Get available induction slots request
 */
export const GetInductionSlotsRequest = z.object({
  gymId: GymId,
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trainerId: UserId.optional(),
})

export type GetInductionSlotsRequest = z.infer<typeof GetInductionSlotsRequest>

/**
 * Available induction slots response
 */
export const InductionSlotsResponse = openapi(
  z.object({
    gymId: GymId,
    slots: z.array(InductionSlot),
  }),
  {
    description: 'Available induction slots',
  },
)

export type InductionSlotsResponse = z.infer<typeof InductionSlotsResponse>

// ============= Missing Schemas for API Generator =============

/**
 * Single induction response
 */
export const InductionResponse = openapi(Induction, {
  description: 'Single induction details',
})

export type InductionResponse = z.infer<typeof InductionResponse>

/**
 * Update induction request (generic update)
 */
export const UpdateInductionRequest = openapi(
  z.object({
    scheduledAt: DateTime.optional(),
    notes: z.string().max(1000).optional(),
    trainerId: UserId.optional(),
  }),
  {
    description: 'Update induction details',
  },
)

export type UpdateInductionRequest = z.infer<typeof UpdateInductionRequest>

/**
 * Complete induction request
 */
export const CompleteInductionRequest = openapi(
  z.object({
    completionNotes: z.string().max(1000).optional(),
    completedAt: DateTime.optional(),
    nextSteps: z.string().max(500).optional(),
  }),
  {
    description: 'Mark induction as completed',
  },
)

export type CompleteInductionRequest = z.infer<typeof CompleteInductionRequest>
