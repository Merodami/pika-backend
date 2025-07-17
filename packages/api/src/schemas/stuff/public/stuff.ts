import { z } from 'zod'

import { GymId } from '../../../common/schemas/branded.js'
import {
  activeStatus,
  withTimestamps,
} from '../../../common/schemas/metadata.js'
import { SearchParams } from '../../../common/schemas/pagination.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Gym equipment, amenities, and features schemas for public API
 */

// ============= Enums =============

export const StuffType = z.enum(['EQUIPMENT', 'AMENITY', 'FEATURE'])
export type StuffType = z.infer<typeof StuffType>

export const EquipmentCategory = z.enum([
  'CARDIO',
  'STRENGTH',
  'FREE_WEIGHTS',
  'MACHINES',
  'FUNCTIONAL',
  'OTHER',
])
export type EquipmentCategory = z.infer<typeof EquipmentCategory>

// ============= Stuff Schema =============

/**
 * Gym equipment, amenity, or feature
 */
export const Stuff = openapi(
  withTimestamps({
    id: UUID,
    name: z.string().min(1).max(100),
    icon: z.string().min(1).max(100).describe('Icon identifier or emoji'),
    type: StuffType,
    gymId: GymId.optional().describe('Specific to a gym, or global if empty'),

    // Additional details
    description: z.string().max(500).optional(),
    category: EquipmentCategory.optional().describe(
      'Category for equipment type',
    ),
    quantity: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number available'),

    // Media
    imageUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),

    // Metadata
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.any()).optional(),
  }).merge(activeStatus),
  {
    description: 'Gym equipment, amenity, or feature',
  },
)

export type Stuff = z.infer<typeof Stuff>

// ============= Create Stuff =============

/**
 * Create stuff request (admin only)
 */
export const CreateStuffRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    icon: z.string().min(1).max(100),
    type: StuffType,
    gymId: GymId.optional(),
    description: z.string().max(500).optional(),
    category: EquipmentCategory.optional(),
    quantity: z.number().int().positive().optional(),
    imageUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
  }),
  {
    description: 'Create new equipment, amenity, or feature',
  },
)

export type CreateStuffRequest = z.infer<typeof CreateStuffRequest>

// ============= Update Stuff =============

/**
 * Update stuff request
 */
export const UpdateStuffRequest = openapi(
  z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    category: EquipmentCategory.optional(),
    quantity: z.number().int().positive().optional(),
    imageUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
  {
    description: 'Update equipment, amenity, or feature',
  },
)

export type UpdateStuffRequest = z.infer<typeof UpdateStuffRequest>

// ============= Search Stuff =============

/**
 * Stuff search parameters
 */
export const StuffSearchParams = SearchParams.extend({
  type: StuffType.optional(),
  category: EquipmentCategory.optional(),
  gymId: GymId.optional().describe('Filter by gym, or null for global'),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['NAME', 'TYPE', 'CREATED_AT']).default('NAME'),
})

export type StuffSearchParams = z.infer<typeof StuffSearchParams>

/**
 * Filter stuff by type query
 */
export const StuffTypeQuery = openapi(
  z.object({
    type: StuffType.describe(
      'Filter stuff by type (EQUIPMENT, AMENITY, or FEATURE)',
    ),
  }),
  {
    description: 'Query parameters for filtering stuff by type',
  },
)

export type StuffTypeQuery = z.infer<typeof StuffTypeQuery>

/**
 * Stuff list response
 */
export const StuffListResponse = paginatedResponse(Stuff)

export type StuffListResponse = z.infer<typeof StuffListResponse>

// ============= Grouped Stuff =============

/**
 * Stuff grouped by type
 */
export const GroupedStuff = openapi(
  z.object({
    equipment: z.array(Stuff).describe('Equipment items'),
    amenities: z.array(Stuff).describe('Amenity items'),
    features: z.array(Stuff).describe('Feature items'),
  }),
  {
    description: 'Stuff items grouped by type',
  },
)

export type GroupedStuff = z.infer<typeof GroupedStuff>

// ============= Gym Stuff Association =============

/**
 * Associate stuff with gym request
 */
export const AssociateStuffRequest = openapi(
  z.object({
    stuffIds: z.array(UUID).min(1).max(100),
    quantity: z
      .record(z.number().int().positive())
      .optional()
      .describe('Quantity per stuff ID'),
  }),
  {
    description: 'Associate equipment/amenities with a gym',
  },
)

export type AssociateStuffRequest = z.infer<typeof AssociateStuffRequest>

/**
 * Gym stuff with quantity
 */
export const GymStuff = Stuff.extend({
  quantity: z.number().int().positive().default(1),
  customName: z.string().optional().describe('Gym-specific name override'),
  location: z.string().optional().describe('Location within the gym'),
})

export type GymStuff = z.infer<typeof GymStuff>

/**
 * Gym stuff list response
 */
export const GymStuffResponse = openapi(
  z.object({
    gymId: GymId,
    equipment: z.array(GymStuff),
    amenities: z.array(GymStuff),
    features: z.array(GymStuff),
    totalItems: z.number().int().nonnegative(),
  }),
  {
    description: 'All stuff associated with a gym',
  },
)

export type GymStuffResponse = z.infer<typeof GymStuffResponse>

// ============= Bulk Operations =============

/**
 * Bulk stuff status update
 */
export const BulkStuffStatusUpdateRequest = openapi(
  z.object({
    stuffIds: z.array(UUID).min(1).max(100),
    isActive: z.boolean(),
  }),
  {
    description: 'Update active status for multiple items',
  },
)

export type BulkStuffStatusUpdateRequest = z.infer<
  typeof BulkStuffStatusUpdateRequest
>

// ============= Popular Stuff =============

/**
 * Popular stuff response
 */
export const PopularStuffResponse = openapi(
  z.object({
    equipment: z.array(
      Stuff.extend({
        gymCount: z
          .number()
          .int()
          .nonnegative()
          .describe('Number of gyms with this item'),
      }),
    ),
    amenities: z.array(
      Stuff.extend({
        gymCount: z.number().int().nonnegative(),
      }),
    ),
    features: z.array(
      Stuff.extend({
        gymCount: z.number().int().nonnegative(),
      }),
    ),
  }),
  {
    description: 'Most popular equipment, amenities, and features',
  },
)

export type PopularStuffResponse = z.infer<typeof PopularStuffResponse>

// ============= Category Management Schemas =============

/**
 * Equipment category details
 */
export const CategoryDetailResponse = openapi(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    itemCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of items in this category'),
    createdAt: DateTime,
    updatedAt: DateTime,
  }),
  {
    description: 'Equipment category details',
  },
)

export type CategoryDetailResponse = z.infer<typeof CategoryDetailResponse>

/**
 * Category list response
 */
export const CategoryListResponse = paginatedResponse(CategoryDetailResponse)

export type CategoryListResponse = z.infer<typeof CategoryListResponse>

/**
 * Category query parameters
 */
export const CategoryQueryParams = openapi(
  z.object({
    search: z.string().optional(),
    hasItems: z.coerce
      .boolean()
      .optional()
      .describe('Only categories with items'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort: z.enum(['name', 'itemCount', 'createdAt']).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
  {
    description: 'Query parameters for category search',
  },
)

export type CategoryQueryParams = z.infer<typeof CategoryQueryParams>

/**
 * Create category request
 */
export const CreateCategoryRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(100).optional(),
  }),
  {
    description: 'Create a new equipment category',
  },
)

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>

/**
 * Update category request
 */
export const UpdateCategoryRequest = openapi(CreateCategoryRequest.partial(), {
  description: 'Update equipment category',
})

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequest>
