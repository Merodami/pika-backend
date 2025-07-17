import { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

// Error response schema
export const ErrorSchema = Type.Object(
  {
    status_code: Type.Integer(),
    error: Type.String(),
    message: Type.String(),
    details: Type.Optional(
      Type.Array(
        Type.Object({
          field: Type.String(),
          message: Type.String(),
        }),
      ),
    ),
  },
  { $id: '#/components/schemas/Error' },
)

export type Error = Static<typeof ErrorSchema>

// Message response schema
export const MessageSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: '#/components/schemas/Message' },
)

export type Message = Static<typeof MessageSchema>
