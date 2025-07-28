import { VouchersService, VoucherServiceService } from './generated'

/**
 * Voucher API Adapter
 * Provides simplified access to voucher-specific API endpoints
 */
export const voucherAdapter = {
  // Public voucher operations
  public: {
    list: VouchersService.getVouchers,
    get: VouchersService.getVouchersId,
    claim: VouchersService.postVouchersClaim,
    validate: VouchersService.postVouchersValidate,
    getUserVouchers: VouchersService.getVouchersUser,
  },

  // Business voucher operations
  business: {
    create: VouchersService.postVouchers,
    update: VouchersService.putVouchersId,
    delete: VouchersService.deleteVouchersId,
    scan: VouchersService.postVouchersIdScan,
    redeem: VouchersService.postVouchersIdRedeem,
  },

  // Voucher books
  books: {
    list: VouchersService.getVouchersBooks,
    get: VouchersService.getVouchersBooksId,
    create: VouchersService.postVouchersBooks,
    update: VouchersService.putVouchersBooksId,
    publish: VouchersService.postVouchersBooksIdPublish,
    archive: VouchersService.postVouchersBooksIdArchive,
  },

  // Internal voucher API (for service-to-service calls)
  internal: {
    getByIds: VoucherServiceService.postVouchersInternalByIds,
  },
}