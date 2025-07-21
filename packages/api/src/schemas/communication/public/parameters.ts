import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Path parameters for notification endpoints
 */

/**
 * Notification ID path parameter
 */
export const NotificationIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Notification ID path parameter',
  },
)

export type NotificationIdParam = z.infer<typeof NotificationIdParam>

/**
 * Template ID path parameter
 */
export const TemplateIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Template ID path parameter',
  },
)

export type TemplateIdParam = z.infer<typeof TemplateIdParam>

/**
 * Communication log ID path parameter
 */
export const CommunicationLogIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Communication log ID path parameter',
  },
)

export type CommunicationLogIdParam = z.infer<typeof CommunicationLogIdParam>
