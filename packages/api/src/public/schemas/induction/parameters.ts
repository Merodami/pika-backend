import { z } from 'zod'

import { GymId } from '../../../common/schemas/branded.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'
import { InductionStatus } from './induction.js'

/**
 * Reusable parameter schemas for induction API endpoints
 */

/**
 * Induction ID path parameter
 */
export const InductionIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Induction ID path parameter',
  },
)

export type InductionIdParam = z.infer<typeof InductionIdParam>

/**
 * Gym ID parameter for inductions
 */
export const InductionGymIdParam = openapi(
  z.object({
    gymId: GymId,
  }),
  {
    description: 'Gym ID path parameter for inductions',
  },
)

export type InductionGymIdParam = z.infer<typeof InductionGymIdParam>

/**
 * Get my inductions query parameters
 */
export const GetMyInductionsQuery = openapi(
  z.object({
    status: InductionStatus.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
  {
    description: 'Query parameters for getting user inductions',
  },
)

export type GetMyInductionsQuery = z.infer<typeof GetMyInductionsQuery>

/**
 * Get gym inductions query parameters
 */
export const GetGymInductionsQuery = openapi(
  z.object({
    status: InductionStatus.optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Query parameters for getting gym inductions',
  },
)

export type GetGymInductionsQuery = z.infer<typeof GetGymInductionsQuery>
