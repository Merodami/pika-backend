import { Static, Type } from '@sinclair/typebox'

// Metadata schema for flexible key-value storage
export const MetadataSchema = Type.Object(
  {},
  {
    $id: '#/components/schemas/Metadata',
    additionalProperties: true,
  },
)

export type Metadata = Static<typeof MetadataSchema>
