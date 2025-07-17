import { GeoPointSchema } from '@api/schemas/shared/geo.js'
import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { NonEmptyString, UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Core user profile schema
export const UserProfileSchema = Type.Object(
  {
    id: UUIDSchema,
    email: Type.String({ format: 'email' }),
    email_verified: Type.Boolean(),
    first_name: NonEmptyString(100),
    last_name: NonEmptyString(100),
    phone_number: Type.Optional(Type.String()),
    phone_verified: Type.Boolean(),
    avatar_url: Type.Optional(Type.String({ format: 'uri' })),
    role: Type.Union([
      Type.Literal('ADMIN'),
      Type.Literal('CUSTOMER'),
      Type.Literal('PROVIDER'),
    ]),
    status: Type.Union([
      Type.Literal('ACTIVE'),
      Type.Literal('SUSPENDED'),
      Type.Literal('BANNED'),
    ]),
    last_login_at: Type.Optional(Type.String({ format: 'date-time' })),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
  },
  { $id: '#/components/schemas/UserProfile' },
)

export type UserProfile = Static<typeof UserProfileSchema>

// User profile update request schema
export const UserProfileUpdateSchema = Type.Object(
  {
    first_name: Type.Optional(NonEmptyString(100)),
    last_name: Type.Optional(NonEmptyString(100)),
    phone_number: Type.Optional(
      Type.String({
        pattern:
          '^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$',
      }),
    ),
    avatar_url: Type.Optional(Type.String({ format: 'uri' })),
  },
  { $id: '#/components/schemas/UserProfileUpdate' },
)

export type UserProfileUpdate = Static<typeof UserProfileUpdateSchema>

// Address schema
export const AddressSchema = Type.Object(
  {
    id: UUIDSchema,
    user_id: UUIDSchema,
    address_line1: NonEmptyString(255),
    address_line2: Type.Optional(Type.String({ maxLength: 255 })),
    city: NonEmptyString(100),
    state: NonEmptyString(100),
    postal_code: NonEmptyString(20),
    country: Type.String({ default: 'Paraguay', maxLength: 100 }),
    is_default: Type.Boolean({ default: false }),
    location: Type.Optional(GeoPointSchema),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
  },
  { $id: '#/components/schemas/Address' },
)

export type Address = Static<typeof AddressSchema>

// Address create request schema
export const AddressCreateSchema = Type.Object(
  {
    address_line1: NonEmptyString(255),
    address_line2: Type.Optional(Type.String({ maxLength: 255 })),
    city: NonEmptyString(100),
    state: NonEmptyString(100),
    postal_code: NonEmptyString(20),
    country: Type.Optional(
      Type.String({ default: 'Paraguay', maxLength: 100 }),
    ),
    is_default: Type.Optional(Type.Boolean({ default: false })),
    location: Type.Optional(GeoPointSchema),
  },
  { $id: '#/components/schemas/AddressCreate' },
)

export type AddressCreate = Static<typeof AddressCreateSchema>

// Address update request schema
export const AddressUpdateSchema = Type.Object(
  {
    address_line1: Type.Optional(NonEmptyString(255)),
    address_line2: Type.Optional(Type.String({ maxLength: 255 })),
    city: Type.Optional(NonEmptyString(100)),
    state: Type.Optional(NonEmptyString(100)),
    postal_code: Type.Optional(NonEmptyString(20)),
    country: Type.Optional(Type.String({ maxLength: 100 })),
    is_default: Type.Optional(Type.Boolean()),
    location: Type.Optional(GeoPointSchema),
  },
  { $id: '#/components/schemas/AddressUpdate' },
)

export type AddressUpdate = Static<typeof AddressUpdateSchema>

// Payment method schema
export const PaymentMethodSchema = Type.Object(
  {
    id: UUIDSchema,
    user_id: UUIDSchema,
    payment_type: Type.Union([
      Type.Literal('CREDIT_CARD'),
      Type.Literal('DEBIT_CARD'),
      Type.Literal('BANK_TRANSFER'),
      Type.Literal('CASH'),
    ]),
    card_brand: Type.Optional(Type.String({ maxLength: 50 })),
    last_four: Type.Optional(Type.String({ pattern: '^[0-9]{4}$' })),
    expiry_month: Type.Optional(Type.Integer({ minimum: 1, maximum: 12 })),
    expiry_year: Type.Optional(Type.Integer({ minimum: 2000 })),
    is_default: Type.Boolean(),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
  },
  { $id: '#/components/schemas/PaymentMethod' },
)

export type PaymentMethod = Static<typeof PaymentMethodSchema>

// Payment method create request schema
export const PaymentMethodCreateSchema = Type.Object(
  {
    payment_type: Type.Union([
      Type.Literal('CREDIT_CARD'),
      Type.Literal('DEBIT_CARD'),
      Type.Literal('BANK_TRANSFER'),
      Type.Literal('CASH'),
    ]),
    card_brand: Type.Optional(Type.String({ maxLength: 50 })),
    last_four: Type.Optional(Type.String({ pattern: '^[0-9]{4}$' })),
    expiry_month: Type.Optional(Type.Integer({ minimum: 1, maximum: 12 })),
    expiry_year: Type.Optional(Type.Integer({ minimum: 2000 })),
    is_default: Type.Optional(Type.Boolean({ default: false })),
  },
  { $id: '#/components/schemas/PaymentMethodCreate' },
)

export type PaymentMethodCreate = Static<typeof PaymentMethodCreateSchema>

// Payment method update request schema
export const PaymentMethodUpdateSchema = Type.Object(
  {
    expiry_month: Type.Optional(Type.Integer({ minimum: 1, maximum: 12 })),
    expiry_year: Type.Optional(Type.Integer({ minimum: 2000 })),
    is_default: Type.Optional(Type.Boolean()),
  },
  { $id: '#/components/schemas/PaymentMethodUpdate' },
)

export type PaymentMethodUpdate = Static<typeof PaymentMethodUpdateSchema>

// Address list response
export const AddressListResponseSchema = Type.Object(
  {
    data: Type.Array(AddressSchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/AddressListResponse' },
)

export type AddressListResponse = Static<typeof AddressListResponseSchema>

// Payment method list response
export const PaymentMethodListResponseSchema = Type.Object(
  {
    data: Type.Array(PaymentMethodSchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/PaymentMethodListResponse' },
)

export type PaymentMethodListResponse = Static<
  typeof PaymentMethodListResponseSchema
>

// User create request schema
export const UserCreateSchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    first_name: NonEmptyString(100),
    last_name: NonEmptyString(100),
    phone_number: Type.Optional(Type.String()),
    role: Type.Union([Type.Literal('CUSTOMER'), Type.Literal('PROVIDER')]),
  },
  { $id: '#/components/schemas/UserCreate' },
)

export type UserCreate = Static<typeof UserCreateSchema>

// User update request schema (for admin operations)
export const UserUpdateSchema = Type.Object(
  {
    email: Type.Optional(Type.String({ format: 'email' })),
    first_name: Type.Optional(NonEmptyString(100)),
    last_name: Type.Optional(NonEmptyString(100)),
    phone_number: Type.Optional(Type.String()),
    status: Type.Optional(
      Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('SUSPENDED'),
        Type.Literal('BANNED'),
      ]),
    ),
    role: Type.Optional(
      Type.Union([
        Type.Literal('ADMIN'),
        Type.Literal('CUSTOMER'),
        Type.Literal('PROVIDER'),
      ]),
    ),
  },
  { $id: '#/components/schemas/UserUpdate' },
)

export type UserUpdate = Static<typeof UserUpdateSchema>
