import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Fraud flag schema
export const FraudFlagSchema = Type.Object({
  type: Type.Union([
    Type.Literal('VELOCITY'),
    Type.Literal('LOCATION_ANOMALY'),
    Type.Literal('RAPID_REDEMPTION'),
    Type.Literal('DISTANT_LOCATION'),
  ]),
  severity: Type.Union([
    Type.Literal('LOW'),
    Type.Literal('MEDIUM'),
    Type.Literal('HIGH'),
  ]),
  message: Type.String(),
  details: Type.Optional(Type.Any()),
})

export type FraudFlag = Static<typeof FraudFlagSchema>

// Fraud case action schema
export const FraudCaseActionSchema = Type.Object({
  type: Type.Union([
    Type.Literal('block_customer'),
    Type.Literal('void_redemption'),
    Type.Literal('flag_provider'),
    Type.Literal('whitelist_pattern'),
  ]),
  timestamp: Type.String({ format: 'date-time' }),
  performed_by: UUIDSchema,
  details: Type.Optional(Type.Any()),
})

export type FraudCaseAction = Static<typeof FraudCaseActionSchema>

// Fraud case status
export const FraudCaseStatusSchema = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('REVIEWING'),
  Type.Literal('APPROVED'),
  Type.Literal('REJECTED'),
  Type.Literal('FALSE_POSITIVE'),
])

export type FraudCaseStatus = Static<typeof FraudCaseStatusSchema>

// Fraud case schema
export const FraudCaseSchema = Type.Object(
  {
    id: UUIDSchema,
    case_number: Type.String({ pattern: '^FRAUD-\\d{4}-\\d{4}$' }),
    redemption_id: UUIDSchema,
    detected_at: Type.String({ format: 'date-time' }),
    risk_score: Type.Integer({ minimum: 0, maximum: 100 }),
    flags: Type.Array(FraudFlagSchema),
    customer_id: UUIDSchema,
    provider_id: UUIDSchema,
    voucher_id: UUIDSchema,
    status: FraudCaseStatusSchema,
    reviewed_at: Type.Optional(Type.String({ format: 'date-time' })),
    reviewed_by: Type.Optional(UUIDSchema),
    review_notes: Type.Optional(Type.String()),
    actions_taken: Type.Optional(Type.Array(FraudCaseActionSchema)),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: '#/components/schemas/FraudCase' },
)

export type FraudCase = Static<typeof FraudCaseSchema>

// Review fraud case DTO
export const ReviewFraudCaseDTOSchema = Type.Object(
  {
    status: Type.Union([
      Type.Literal('APPROVED'),
      Type.Literal('REJECTED'),
      Type.Literal('FALSE_POSITIVE'),
    ]),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
    actions: Type.Optional(
      Type.Array(
        Type.Object({
          type: Type.Union([
            Type.Literal('block_customer'),
            Type.Literal('void_redemption'),
            Type.Literal('flag_provider'),
            Type.Literal('whitelist_pattern'),
          ]),
          details: Type.Optional(Type.Any()),
        }),
      ),
    ),
  },
  { $id: '#/components/schemas/ReviewFraudCaseDTO' },
)

export type ReviewFraudCaseDTO = Static<typeof ReviewFraudCaseDTOSchema>

// Fraud case search params
export const FraudCaseSearchParamsSchema = Type.Object({
  status: Type.Optional(FraudCaseStatusSchema),
  provider_id: Type.Optional(UUIDSchema),
  customer_id: Type.Optional(UUIDSchema),
  from_date: Type.Optional(Type.String({ format: 'date' })),
  to_date: Type.Optional(Type.String({ format: 'date' })),
  min_risk_score: Type.Optional(Type.Integer({ minimum: 0, maximum: 100 })),
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  // sort: Type.Optional(
  //   createSortSchema(['detected_at', 'risk_score', 'status', 'case_number']),
  // ),
})

export type FraudCaseSearchParams = Static<typeof FraudCaseSearchParamsSchema>

// Paginated fraud case response
export const PaginatedFraudCaseResponseSchema = Type.Object(
  {
    items: Type.Array(FraudCaseSchema),
    ...PaginationMetadataSchema.properties,
  },
  { $id: '#/components/schemas/PaginatedFraudCaseResponse' },
)

export type PaginatedFraudCaseResponse = Static<
  typeof PaginatedFraudCaseResponseSchema
>

// Fraud statistics params
export const FraudStatisticsParamsSchema = Type.Object({
  provider_id: Type.Optional(UUIDSchema),
  period: Type.Optional(
    Type.Union([
      Type.Literal('day'),
      Type.Literal('week'),
      Type.Literal('month'),
    ]),
  ),
})

export type FraudStatisticsParams = Static<typeof FraudStatisticsParamsSchema>

// Fraud statistics response
export const FraudStatisticsResponseSchema = Type.Object(
  {
    total_cases: Type.Integer({ minimum: 0 }),
    pending_cases: Type.Integer({ minimum: 0 }),
    false_positive_rate: Type.Number({ minimum: 0, maximum: 100 }),
    average_risk_score: Type.Number({ minimum: 0, maximum: 100 }),
    top_fraud_types: Type.Array(
      Type.Object({
        type: Type.String(),
        count: Type.Integer({ minimum: 0 }),
        percentage: Type.Number({ minimum: 0, maximum: 100 }),
      }),
    ),
    risk_score_distribution: Type.Object({
      low: Type.Integer({ minimum: 0 }),
      medium: Type.Integer({ minimum: 0 }),
      high: Type.Integer({ minimum: 0 }),
    }),
    time_metrics: Type.Object({
      average_review_time: Type.Number({ minimum: 0 }),
      cases_last_24h: Type.Integer({ minimum: 0 }),
      cases_last_7d: Type.Integer({ minimum: 0 }),
    }),
  },
  { $id: '#/components/schemas/FraudStatisticsResponse' },
)

export type FraudStatisticsResponse = Static<
  typeof FraudStatisticsResponseSchema
>

// Fraud log response (for the read endpoint)
export const FraudLogResponseSchema = Type.Object(
  {
    logs: Type.Array(
      Type.Object({
        voucher_id: UUIDSchema,
        customer_id: UUIDSchema,
        provider_id: UUIDSchema,
        location: Type.Optional(
          Type.Object({
            lat: Type.Number({ minimum: -90, maximum: 90 }),
            lng: Type.Number({ minimum: -180, maximum: 180 }),
          }),
        ),
        timestamp: Type.String({ format: 'date-time' }),
        flags: Type.Array(FraudFlagSchema),
        risk_score: Type.Integer({ minimum: 0, maximum: 100 }),
      }),
    ),
  },
  { $id: '#/components/schemas/FraudLogResponse' },
)

export type FraudLogResponse = Static<typeof FraudLogResponseSchema>
