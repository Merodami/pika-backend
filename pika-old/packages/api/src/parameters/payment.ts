import { OpenAPIV3 } from 'openapi-types'

export const PaymentIdParam: OpenAPIV3.ParameterObject = {
  name: 'payment_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the payment',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const PaymentStatusParam: OpenAPIV3.ParameterObject = {
  name: 'status',
  in: 'query',
  required: false,
  description: 'Filter by payment status',
  schema: {
    type: 'string',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
  },
}

export const PaymentFromDateParam: OpenAPIV3.ParameterObject = {
  name: 'from_date',
  in: 'query',
  required: false,
  description: 'Filter payments from this date (YYYY-MM-DD)',
  schema: {
    type: 'string',
    format: 'date',
    example: '2025-05-01',
  },
}

export const PaymentToDateParam: OpenAPIV3.ParameterObject = {
  name: 'to_date',
  in: 'query',
  required: false,
  description: 'Filter payments to this date (YYYY-MM-DD)',
  schema: {
    type: 'string',
    format: 'date',
    example: '2025-05-31',
  },
}
