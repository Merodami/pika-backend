import {
  MyBusinessService,
  VouchersService,
  BusinessServiceService,
} from './generated'

/**
 * Business API Adapter
 * Provides simplified access to business-specific API endpoints
 */
export const businessAdapter = {
  // My business profile
  profile: {
    get: MyBusinessService.getBusinessesMy,
    create: MyBusinessService.postBusinessesMy,
    update: MyBusinessService.putBusinessesMy,
  },

  // Business vouchers
  vouchers: {
    list: VouchersService.getVouchers,
    get: VouchersService.getVouchersId,
    create: VouchersService.postVouchers,
    update: VouchersService.putVouchersId,
    delete: VouchersService.deleteVouchersId,
    scan: VouchersService.postVouchersIdScan,
    redeem: VouchersService.postVouchersIdRedeem,
    validate: VouchersService.postVouchersValidate,
    claim: VouchersService.postVouchersClaim,
  },

  // Voucher books
  voucherBooks: {
    list: VouchersService.getVouchersBooks,
    get: VouchersService.getVouchersBooksId,
    create: VouchersService.postVouchersBooks,
    update: VouchersService.putVouchersBooksId,
    publish: VouchersService.postVouchersBooksIdPublish,
    archive: VouchersService.postVouchersBooksIdArchive,
  },

  // Business internal API (for service-to-service calls)
  internal: {
    get: BusinessServiceService.getBusinessesInternalBusinessesId,
    list: BusinessServiceService.getBusinessesInternalBusinesses,
    getByUser: BusinessServiceService.postBusinessesInternalByUser,
  },
}