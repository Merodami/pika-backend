import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { createSortSchema } from '@api/schemas/utils/helper.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Payment status enum
export const PaymentStatusEnum = Type.Union(
  [
    Type.Literal('PENDING'),
    Type.Literal('PROCESSING'),
    Type.Literal('COMPLETED'),
    Type.Literal('FAILED'),
    Type.Literal('REFUNDED'),
  ],
  { $id: '#/components/schemas/PaymentStatus' },
)

export type PaymentStatus = Static<typeof PaymentStatusEnum>

// Payment schema
export const PaymentSchema = Type.Object(
  {
    id: UUIDSchema,
    payment_method_id: Type.Optional(UUIDSchema),
    amount: Type.Number({ minimum: 0 }),
    currency: Type.String({ default: 'PYG', maxLength: 3 }),
    status: PaymentStatusEnum,
    external_reference: Type.Optional(Type.String()),
    processor_response: Type.Optional(Type.Object({})),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
    completed_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: '#/components/schemas/Payment' },
)

export type Payment = Static<typeof PaymentSchema>

// Payment initiation request schema
export const PaymentInitiationRequestSchema = Type.Object(
  {
    payment_method_id: UUIDSchema,
  },
  { $id: '#/components/schemas/PaymentInitiationRequest' },
)

export type PaymentInitiationRequest = Static<
  typeof PaymentInitiationRequestSchema
>

// Payment initiation response schema
export const PaymentInitiationSchema = Type.Object(
  {
    id: UUIDSchema,
    amount: Type.Number({ minimum: 0 }),
    currency: Type.String(),
    status: Type.Union([Type.Literal('PENDING'), Type.Literal('PROCESSING')]),
    redirect_url: Type.String({ format: 'uri' }),
    external_reference: Type.Optional(Type.String()),
  },
  { $id: '#/components/schemas/PaymentInitiation' },
)

export type PaymentInitiation = Static<typeof PaymentInitiationSchema>

// Payment processor callback schema
export const PaymentProcessorCallbackSchema = Type.Object(
  {
    operation: Type.Object({}),
  },
  { $id: '#/components/schemas/PaymentProcessorCallback' },
)

export type PaymentProcessorCallback = Static<
  typeof PaymentProcessorCallbackSchema
>

// Payment processor response schema
export const PaymentProcessorResponseSchema = Type.Object(
  {
    status: Type.String(),
  },
  { $id: '#/components/schemas/PaymentProcessorResponse' },
)

export type PaymentProcessorResponse = Static<
  typeof PaymentProcessorResponseSchema
>

// Payment list response schema
export const PaymentListResponseSchema = Type.Object(
  {
    data: Type.Array(PaymentSchema),
    pagination: PaginationMetadataSchema,
  },
  { $id: '#/components/schemas/PaymentListResponse' },
)

export type PaymentListResponse = Static<typeof PaymentListResponseSchema>

// Define allowed sort fields for payments
const PaymentSortFields = Type.Union(
  [
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
    Type.Literal('completed_at'),
    Type.Literal('amount'),
    Type.Literal('status'),
  ],
  { default: 'created_at' },
)

// Payment search query parameters schema
export const PaymentSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    status: Type.Optional(
      Type.Union([
        Type.Literal('pending'),
        Type.Literal('processing'),
        Type.Literal('completed'),
        Type.Literal('failed'),
        Type.Literal('refunded'),
      ]),
    ),
    from_date: Type.Optional(Type.String({ format: 'date' })),
    to_date: Type.Optional(Type.String({ format: 'date' })),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach
    ...createSortSchema(
      PaymentSortFields,
      'created_at', // Default sort field
      'desc', // Default sort direction (newest first)
    ),
  },
  { $id: '#/components/schemas/PaymentSearchQuery' },
)

export type PaymentSearchQuery = Static<typeof PaymentSearchQuerySchema>
