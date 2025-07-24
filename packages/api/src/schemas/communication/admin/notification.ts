import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { CreateNotificationRequest } from '../public/notification.js'

/**
 * Admin notification schemas
 */

/**
 * Create global notification request
 */
export const CreateGlobalNotificationRequest = CreateNotificationRequest.omit({
  userId: true,
  subToken: true,
})

export type CreateGlobalNotificationRequest = z.infer<
  typeof CreateGlobalNotificationRequest
>

/**
 * Create global notification response
 */
export const CreateGlobalNotificationResponse = openapi(
  z.object({
    count: z.number().int().nonnegative().describe('Number of notifications created'),
    message: z.string().optional().describe('Success message'),
  }),
  {
    description: 'Response when creating global notifications',
  },
)

export type CreateGlobalNotificationResponse = z.infer<
  typeof CreateGlobalNotificationResponse
>