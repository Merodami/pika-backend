import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'
import { SearchParams } from '../../../shared/pagination.js'
import { UUID } from '../../../shared/primitives.js'

/**
 * Wizard-specific query parameters
 */

/**
 * Get user drafts query parameters (raw Zod)
 */
export const GetUserDraftsQuery = SearchParams.extend({
  businessId: UUID.optional().describe('Filter by business ID'),
})

/**
 * Get user drafts query parameters (OpenAPI documented)
 */
export const GetUserDraftsQuerySchema = openapi(GetUserDraftsQuery, {
  description: 'Query parameters for listing user drafts',
})

export type GetUserDraftsQuery = z.infer<typeof GetUserDraftsQuery>
