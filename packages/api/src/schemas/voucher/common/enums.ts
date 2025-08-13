import {
  AdminVoucherSortBy,
  BatchOperationType as BatchOperationTypeEnum,
  CustomerVoucherStatus,
  UserVoucherSortBy,
  UserVoucherStatusFilter as UserVoucherStatusFilterEnum,
  VoucherBookStatus,
  VoucherBookType,
  VoucherCodeType,
  VoucherDiscountType,
  VoucherScanSource,
  VoucherScanType,
  VoucherSortBy,
  VoucherState,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Voucher-specific enum schemas
 * Following the standardized pattern with Schema suffix
 */

// Voucher state schema
export const VoucherStateSchema = createZodEnum(VoucherState).openapi(
  'VoucherState',
  {
    description: 'Current state of the voucher lifecycle',
    example: VoucherState.PUBLISHED,
  },
)

// Voucher discount type schema
export const VoucherDiscountTypeSchema = createZodEnum(
  VoucherDiscountType,
).openapi('VoucherDiscountType', {
  description: 'Type of discount the voucher provides',
  example: VoucherDiscountType.PERCENTAGE,
})

// Voucher code type schema
export const VoucherCodeTypeSchema = createZodEnum(VoucherCodeType).openapi(
  'VoucherCodeType',
  {
    description: 'Type of voucher code',
    example: VoucherCodeType.QR,
  },
)

// Voucher scan source schema
export const VoucherScanSourceSchema = createZodEnum(VoucherScanSource).openapi(
  'VoucherScanSource',
  {
    description: 'Source of the voucher scan',
    example: VoucherScanSource.CAMERA,
  },
)

// Voucher scan type schema
export const VoucherScanTypeSchema = createZodEnum(VoucherScanType).openapi(
  'VoucherScanType',
  {
    description: 'Type of voucher scan',
    example: VoucherScanType.customer,
  },
)

// Customer voucher status schema
export const CustomerVoucherStatusSchema = createZodEnum(
  CustomerVoucherStatus,
).openapi('CustomerVoucherStatus', {
  description: 'Status of voucher from customer perspective',
  example: CustomerVoucherStatus.CLAIMED,
})

// Voucher book status schema
export const VoucherBookStatusSchema = createZodEnum(VoucherBookStatus).openapi(
  'VoucherBookStatus',
  {
    description: 'Status of a voucher book in the publishing workflow',
    example: VoucherBookStatus.DRAFT,
  },
)

// Voucher book type schema
export const VoucherBookTypeSchema = createZodEnum(VoucherBookType).openapi(
  'VoucherBookType',
  {
    description: 'Type of voucher book',
    example: VoucherBookType.MONTHLY,
  },
)

// Voucher sorting schemas
export const VoucherSortBySchema = createZodEnum(VoucherSortBy).openapi(
  'VoucherSortBy',
  {
    description: 'Field to sort vouchers by',
    example: VoucherSortBy.CREATED_AT,
  },
)

export const AdminVoucherSortBySchema = createZodEnum(
  AdminVoucherSortBy,
).openapi('AdminVoucherSortBy', {
  description: 'Admin voucher sort fields',
  example: AdminVoucherSortBy.CREATED_AT,
})

export const UserVoucherSortBySchema = createZodEnum(UserVoucherSortBy).openapi(
  'UserVoucherSortBy',
  {
    description: 'User voucher sort fields',
    example: UserVoucherSortBy.CLAIMED_AT,
  },
)

// Additional schema-specific enums
export const UserVoucherStatusFilter = createZodEnum(
  UserVoucherStatusFilterEnum,
)

export const UserVoucherStatusFilterSchema = openapi(UserVoucherStatusFilter, {
  description: 'User voucher status filter',
  example: UserVoucherStatusFilterEnum.CLAIMED,
})

export const BatchOperationType = createZodEnum(BatchOperationTypeEnum)

export const BatchOperationTypeSchema = openapi(BatchOperationType, {
  description: 'Type of batch operation to perform',
  example: BatchOperationTypeEnum.PUBLISH,
})
