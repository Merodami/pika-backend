import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * Query parameters for user endpoints
 */

/**
 * Get user by ID query parameters
 */
export const GetUserByIdQuery = openapi(
  z.object({
    includeProfessional: z.coerce
      .boolean()
      .optional()
      .describe('Include professional details'),
    includeParq: z.coerce
      .boolean()
      .optional()
      .describe(
        'Include PARQ (Physical Activity Readiness Questionnaire) data',
      ),
    includeFriends: z.coerce
      .boolean()
      .optional()
      .describe('Include friends list'),
  }),
  {
    description: 'Query parameters for retrieving user details',
  },
)

export type GetUserByIdQuery = z.infer<typeof GetUserByIdQuery>
