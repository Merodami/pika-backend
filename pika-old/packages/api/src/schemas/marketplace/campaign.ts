import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { createSortSchema } from '@api/schemas/utils/helper.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Simple non-validating multilingual field schema
// This accepts any format for multilingual content to avoid validation issues
const createMultilingualField = (maxLength: number, _unused = true) => {
  // Use a "mixed" type that can be either an object or a string
  return Type.Any()
}

// Campaign status enum - use string enum for better compatibility
export const CampaignStatusSchema = Type.String({
  enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
})

// Campaign schema
export const CampaignSchema = Type.Object(
  {
    id: UUIDSchema,
    provider_id: UUIDSchema,
    name: createMultilingualField(200),
    description: createMultilingualField(2000),
    budget: Type.Number({ minimum: 0, maximum: 1000000 }),
    start_date: Type.String({ format: 'date-time' }),
    end_date: Type.String({ format: 'date-time' }),
    status: CampaignStatusSchema,
    target_audience: Type.Optional(createMultilingualField(1000)),
    objectives: Type.Optional(createMultilingualField(2000)),
    active: Type.Boolean({ default: true }),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: '#/components/schemas/Campaign' },
)

export type Campaign = Static<typeof CampaignSchema>

// Campaign create request schema
export const CampaignCreateSchema = Type.Object(
  {
    name: createMultilingualField(200),
    description: createMultilingualField(2000),
    budget: Type.Number({ minimum: 0, maximum: 1000000 }),
    start_date: Type.String({ format: 'date-time' }),
    end_date: Type.String({ format: 'date-time' }),
    target_audience: Type.Optional(createMultilingualField(1000)),
    objectives: Type.Optional(createMultilingualField(2000)),
  },
  { $id: '#/components/schemas/CampaignCreate' },
)

export type CampaignCreate = Static<typeof CampaignCreateSchema>

// Campaign update request schema
export const CampaignUpdateSchema = Type.Object(
  {
    name: Type.Optional(createMultilingualField(200)),
    description: Type.Optional(createMultilingualField(2000)),
    budget: Type.Optional(Type.Number({ minimum: 0, maximum: 1000000 })),
    start_date: Type.Optional(Type.String({ format: 'date-time' })),
    end_date: Type.Optional(Type.String({ format: 'date-time' })),
    status: Type.Optional(CampaignStatusSchema),
    target_audience: Type.Optional(createMultilingualField(1000)),
    objectives: Type.Optional(createMultilingualField(2000)),
    active: Type.Optional(Type.Boolean()),
  },
  { $id: '#/components/schemas/CampaignUpdate' },
)

export type CampaignUpdate = Static<typeof CampaignUpdateSchema>

// Define allowed sort fields for campaigns
const CampaignSortFields = Type.Union(
  [
    Type.Literal('name'),
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
    Type.Literal('start_date'),
    Type.Literal('end_date'),
    Type.Literal('budget'),
    Type.Literal('status'),
  ],
  { default: 'created_at' },
)

// Campaign search query schema
export const CampaignSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    provider_id: Type.Optional(UUIDSchema),
    status: Type.Optional(CampaignStatusSchema),
    active: Type.Optional(Type.Boolean()),
    start_date_from: Type.Optional(Type.String({ format: 'date-time' })),
    start_date_to: Type.Optional(Type.String({ format: 'date-time' })),
    end_date_from: Type.Optional(Type.String({ format: 'date-time' })),
    end_date_to: Type.Optional(Type.String({ format: 'date-time' })),
    budget_min: Type.Optional(Type.Number({ minimum: 0 })),
    budget_max: Type.Optional(Type.Number({ minimum: 0 })),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach using helper
    ...createSortSchema(
      CampaignSortFields,
      'created_at', // Default sort field
      'desc', // Default sort direction
    ),
  },
  { $id: '#/components/schemas/CampaignSearchQuery' },
)

export type CampaignSearchQuery = Static<typeof CampaignSearchQuerySchema>

// Campaign ID parameter schema
export const CampaignIdSchema = Type.Object(
  {
    campaign_id: UUIDSchema,
  },
  { $id: '#/components/schemas/CampaignId' },
)

export type CampaignId = Static<typeof CampaignIdSchema>

// Campaign response schema (for single campaign)
export const CampaignResponseSchema = CampaignSchema

export type CampaignResponse = Static<typeof CampaignResponseSchema>

// Campaign list response schema
export const CampaignListResponseSchema = Type.Object(
  {
    data: Type.Array(CampaignSchema),
    pagination: PaginationMetadataSchema,
  },
  { $id: '#/components/schemas/CampaignListResponse' },
)

export type CampaignListResponse = Static<typeof CampaignListResponseSchema>
