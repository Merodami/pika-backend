import {
  BusinessServiceService,
  MyBusinessService,
  VoucherManagementService,
  VouchersService,
} from './generated'

/**
 * Business API Adapter
 * Provides simplified access to business-specific API endpoints
 */
export const businessAdapter = {
  // My business profile
  profile: {
    get: MyBusinessService.getMyBusiness,
    create: MyBusinessService.postMyBusiness,
    update: MyBusinessService.putMyBusiness,
    delete: MyBusinessService.deleteMyBusiness,
  },

  // Business voucher management (for business owners)
  vouchers: {
    // Management operations
    list: VoucherManagementService.getVouchers,
    create: VoucherManagementService.postVouchers,
    get: VoucherManagementService.getVouchers1, // Auto-generated name for GET /vouchers/{id}
    update: VoucherManagementService.putVouchers,
    delete: VoucherManagementService.deleteVouchers,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,

    // Customer-facing operations
    scan: VouchersService.postVouchersScan,
    claim: VouchersService.postVouchersClaim,
    redeem: VouchersService.postVouchersRedeem,
    getUserVouchers: VouchersService.getUsersVouchers,
  },

  // Public business API
  public: {
    list: BusinessServiceService.getBusinesses,
    listByCategory: BusinessServiceService.getCategoriesBusinesses,
    bulkGet: BusinessServiceService.postBusinessesBulk,
    validate: BusinessServiceService.postBusinessesValidate,
    getByUser: BusinessServiceService.postBusinessesByUser,
    checkExists: BusinessServiceService.postBusinessesExists,
  },
}
