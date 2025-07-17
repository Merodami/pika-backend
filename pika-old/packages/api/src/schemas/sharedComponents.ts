import { ReviewSchema } from '@api/schemas/marketplace/review.js'
import { VoucherSchema } from '@api/schemas/marketplace/voucher.js'
import {
  PaymentMethodSchema,
  UserProfileSchema,
} from '@api/schemas/user/user.js'
import { Type } from '@sinclair/typebox'

// Bundle all of your shared components into one module with proper $id
export const Components = Type.Object(
  {
    UserProfileSchema: UserProfileSchema,
    VoucherSchema: VoucherSchema,
    PaymentMethodSchema: PaymentMethodSchema,
    ReviewSchema: ReviewSchema,
  },
  { $id: 'SharedComponents' },
)

export type Components = typeof Components
