import { VoucherManagementService, VouchersService } from './generated'

/**
 * Voucher API Adapter
 * Provides simplified access to voucher-specific API endpoints
 */
export const voucherAdapter = {
  // Public voucher operations (customer-facing)
  public: {
    scan: VouchersService.postVouchersScan,
    claim: VouchersService.postVouchersClaim,
    redeem: VouchersService.postVouchersRedeem,
    getUserVouchers: VouchersService.getUsersVouchers,
  },

  // Admin/Business voucher management
  management: {
    list: VoucherManagementService.getVouchers,
    create: VoucherManagementService.postVouchers,
    get: VoucherManagementService.getVouchers1, // Auto-generated name for GET /vouchers/{id}
    update: VoucherManagementService.putVouchers,
    delete: VoucherManagementService.deleteVouchers,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,
  },

  // Internal voucher API (for service-to-service calls)
  internal: {
    // Add methods as they become available in VoucherServiceService
  },
}
