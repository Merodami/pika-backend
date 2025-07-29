import {
  BusinessManagementService,
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
    create: MyBusinessService.createMyBusiness,
    update: MyBusinessService.updateMyBusiness,
    delete: MyBusinessService.deleteMyBusiness,
  },

  // Business voucher management (for business owners)
  vouchers: {
    // Management operations
    list: VoucherManagementService.getAdminVoucherList,
    create: VoucherManagementService.createAdminVoucher,
    get: VoucherManagementService.getAdminVoucherById,
    update: VoucherManagementService.updateAdminVoucher,
    delete: VoucherManagementService.deleteAdminVoucher,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,

    // Customer-facing operations
    scan: VouchersService.scanVoucher,
    claim: VouchersService.claimVoucher,
    redeem: VouchersService.redeemVoucher,
    getUserVouchers: VouchersService.getUserVouchers,
  },

  // Admin business management
  admin: {
    list: BusinessManagementService.getAdminBusinessList,
    get: BusinessManagementService.getAdminBusinessById,
    create: BusinessManagementService.createAdminBusiness,
    update: BusinessManagementService.updateAdminBusiness,
    delete: BusinessManagementService.deleteAdminBusiness,
    verify: BusinessManagementService.updateAdminBusinessVerification,
    activate: BusinessManagementService.activateAdminBusiness,
    deactivate: BusinessManagementService.deactivateAdminBusiness,
    updateRating: BusinessManagementService.updateAdminBusinessRating,
    bulkUpdate: BusinessManagementService.bulkUpdateAdminBusinesses,
    bulkDelete: BusinessManagementService.bulkDeleteAdminBusinesses,
  },

  // Public business API
  public: {
    get: BusinessServiceService.getInternalBusinessById,
    listByCategory: BusinessServiceService.getInternalBusinessesByCategory,
    bulkGet: BusinessServiceService.bulkGetInternalBusinesses,
    validate: BusinessServiceService.validateInternalBusinesses,
    getByUser: BusinessServiceService.getInternalBusinessesByUser,
    checkExists: BusinessServiceService.checkInternalBusinessExists,
  },
}
