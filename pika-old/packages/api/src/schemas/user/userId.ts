import { Static, Type } from '@sinclair/typebox'

import { UUIDSchema } from '../utils/uuid.js'

// User ID parameter schema
export const UserIdParamSchema = Type.Object(
  {
    user_id: UUIDSchema,
  },
  { $id: '#/components/schemas/UserIdParam' },
)

export type UserIdParam = Static<typeof UserIdParamSchema>
