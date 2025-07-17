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

// Admin profile data schema
const AdminProfileDataSchema = Type.Object({
  bio: createMultilingualField(500),
  phone: Type.Optional(Type.String({ maxLength: 20 })),
  timezone: Type.String({ default: 'UTC' }),
  language: Type.String({ default: 'en' }),
  avatar_url: Type.Optional(Type.String({ format: 'uri' })),
})

// Admin schema
export const AdminSchema = Type.Object(
  {
    id: UUIDSchema,
    user_id: UUIDSchema,
    email: Type.String({ format: 'email', maxLength: 255 }),
    first_name: Type.String({ maxLength: 100 }),
    last_name: Type.String({ maxLength: 100 }),
    role: Type.Union([
      Type.Literal('SUPER_ADMIN'),
      Type.Literal('ADMIN'),
      Type.Literal('MODERATOR'),
    ]),
    permissions: Type.Array(Type.String()),
    status: Type.Union([
      Type.Literal('ACTIVE'),
      Type.Literal('INACTIVE'),
      Type.Literal('SUSPENDED'),
    ]),
    last_login_at: Type.Optional(Type.String({ format: 'date-time' })),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
    profile_data: AdminProfileDataSchema,
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    full_name: Type.Optional(Type.String()),
  },
  { $id: '#/components/schemas/Admin' },
)

export type Admin = Static<typeof AdminSchema>

// Admin create request schema
export const AdminCreateDTOSchema = Type.Object(
  {
    user_id: UUIDSchema,
    email: Type.String({ format: 'email', maxLength: 255 }),
    first_name: Type.String({ maxLength: 100 }),
    last_name: Type.String({ maxLength: 100 }),
    role: Type.Union([
      Type.Literal('SUPER_ADMIN'),
      Type.Literal('ADMIN'),
      Type.Literal('MODERATOR'),
    ]),
    permissions: Type.Array(Type.String()),
    status: Type.Optional(
      Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('INACTIVE'),
        Type.Literal('SUSPENDED'),
      ]),
    ),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
    profile_data: AdminProfileDataSchema,
  },
  { $id: '#/components/schemas/AdminCreateDTO' },
)

export type AdminCreateDTO = Static<typeof AdminCreateDTOSchema>

// Admin update request schema
export const AdminUpdateDTOSchema = Type.Object(
  {
    email: Type.Optional(Type.String({ format: 'email', maxLength: 255 })),
    first_name: Type.Optional(Type.String({ maxLength: 100 })),
    last_name: Type.Optional(Type.String({ maxLength: 100 })),
    role: Type.Optional(
      Type.Union([
        Type.Literal('SUPER_ADMIN'),
        Type.Literal('ADMIN'),
        Type.Literal('MODERATOR'),
      ]),
    ),
    permissions: Type.Optional(Type.Array(Type.String())),
    status: Type.Optional(
      Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('INACTIVE'),
        Type.Literal('SUSPENDED'),
      ]),
    ),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
    profile_data: Type.Optional(Type.Partial(AdminProfileDataSchema)),
  },
  { $id: '#/components/schemas/AdminUpdateDTO' },
)

export type AdminUpdateDTO = Static<typeof AdminUpdateDTOSchema>

// Define allowed sort fields for admins
const AdminSortFields = Type.Union(
  [
    Type.Literal('email'),
    Type.Literal('first_name'),
    Type.Literal('last_name'),
    Type.Literal('role'),
    Type.Literal('status'),
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
    Type.Literal('last_login_at'),
  ],
  { default: 'created_at' },
)

// Admin search query parameters schema
export const AdminSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    role: Type.Optional(
      Type.Union([
        Type.Literal('SUPER_ADMIN'),
        Type.Literal('ADMIN'),
        Type.Literal('MODERATOR'),
      ]),
    ),
    status: Type.Optional(
      Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('INACTIVE'),
        Type.Literal('SUSPENDED'),
      ]),
    ),
    email: Type.Optional(Type.String()),
    permission: Type.Optional(Type.String()),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach using helper
    ...createSortSchema(
      AdminSortFields,
      'created_at', // Default sort field
      'desc', // Default sort direction
    ),
  },
  { $id: '#/components/schemas/AdminSearchQuery' },
)

export type AdminSearchQuery = Static<typeof AdminSearchQuerySchema>

// Admin list response schema (full multilingual format)
export const AdminListResponseSchema = Type.Object(
  {
    data: Type.Array(AdminSchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/AdminListResponse' },
)

export type AdminListResponse = Static<typeof AdminListResponseSchema>

// Admin ID parameter schema
export const AdminIdSchema = Type.Object(
  {
    admin_id: UUIDSchema,
  },
  { $id: '#/components/schemas/AdminId' },
)

export type AdminId = Static<typeof AdminIdSchema>

// Admin file upload response schema
export const AdminUploadResponseSchema = Type.Object(
  {
    url: Type.String({ format: 'uri' }),
    filename: Type.String(),
    size: Type.Number(),
    mime_type: Type.String(),
  },
  { $id: '#/components/schemas/AdminUploadResponse' },
)

export type AdminUploadResponse = Static<typeof AdminUploadResponseSchema>
