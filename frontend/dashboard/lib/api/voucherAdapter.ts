import { VoucherManagementService, VouchersService } from './generated'

/**
 * Voucher API Adapter
 * Provides simplified access to voucher-specific API endpoints
 */
export const voucherAdapter = {
  // Public voucher operations (customer-facing)
  public: {
    scan: VouchersService.scanVoucher,
    claim: VouchersService.claimVoucher,
    redeem: VouchersService.redeemVoucher,
    getUserVouchers: VouchersService.getUserVouchers,
  },

  // Admin/Business voucher management
  management: {
    list: VoucherManagementService.getAdminVoucherList,
    create: VoucherManagementService.createAdminVoucher,
    get: VoucherManagementService.getAdminVoucherById,
    update: VoucherManagementService.updateAdminVoucher,
    delete: VoucherManagementService.deleteAdminVoucher,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,
  },

  // Internal voucher API (for service-to-service calls)
  internal: {
    // Add methods as they become available in VoucherServiceService
  },
}
