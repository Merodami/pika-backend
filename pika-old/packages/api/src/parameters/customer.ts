import { OpenAPIV3 } from 'openapi-types'

export const CustomerIdParam: OpenAPIV3.ParameterObject = {
  name: 'customer_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the customer',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
}
