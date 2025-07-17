import { OpenAPIV3 } from 'openapi-types'

export const AddressIdParam: OpenAPIV3.ParameterObject = {
  name: 'address_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the address',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const PaymentMethodIdParam: OpenAPIV3.ParameterObject = {
  name: 'payment_method_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the payment method',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const UserRoleParam: OpenAPIV3.ParameterObject = {
  name: 'role',
  in: 'query',
  required: false,
  description: 'Filter by user role',
  schema: {
    type: 'string',
    enum: ['ADMIN', 'CUSTOMER', 'PROVIDER'],
  },
}

export const UserStatusParam: OpenAPIV3.ParameterObject = {
  name: 'status',
  in: 'query',
  required: false,
  description: 'Filter by user status',
  schema: {
    type: 'string',
    enum: ['ACTIVE', 'SUSPENDED', 'BANNED'],
  },
}
