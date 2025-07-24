import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * Communication service specific responses
 */

/**
 * Mark all as read response
 */
export const MarkAllAsReadResponse = openapi(
  z.object({
    message: z.string().default('All notifications marked as read'),
  }),
  {
    description: 'Response when all notifications are marked as read',
  },
)

export type MarkAllAsReadResponse = z.infer<typeof MarkAllAsReadResponse>

/**
 * Delete notification response
 */
export const DeleteNotificationResponse = openapi(
  z.object({
    message: z.string().default('Notification deleted successfully'),
  }),
  {
    description: 'Response when a notification is deleted',
  },
)

export type DeleteNotificationResponse = z.infer<typeof DeleteNotificationResponse>