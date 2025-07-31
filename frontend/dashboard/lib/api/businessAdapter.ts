import {
  BusinessManagementService,
  VoucherManagementService,
} from './generated'

/**
 * Business API Adapter
 * Provides simplified access to business-specific API endpoints
 */
export const businessAdapter = {
  // My business profile
  profile: {
    // get: MyBusinessService.getMyBusiness, // Unused: no references found in hooks
    // create: MyBusinessService.createMyBusiness, // Unused: no references found in hooks
    // update: MyBusinessService.updateMyBusiness, // Unused: no references found in hooks
    // delete: MyBusinessService.deleteMyBusiness, // Unused: no references found in hooks
  },

  // Business voucher management (for business owners)
  vouchers: {
    // Management operations - ACTIVE
    list: VoucherManagementService.getAdminVoucherList,
    create: VoucherManagementService.createAdminVoucher,
    get: VoucherManagementService.getAdminVoucherById,
    update: VoucherManagementService.updateAdminVoucher,
    delete: VoucherManagementService.deleteAdminVoucher,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    // analytics: VoucherManagementService.getVouchersAnalytics, // Unused: no references found in hooks

    // Customer-facing operations - UNUSED
    // scan: VouchersService.scanVoucher, // Unused: no references found in hooks
    // claim: VouchersService.claimVoucher, // Unused: no references found in hooks
    // redeem: VouchersService.redeemVoucher, // Unused: no references found in hooks
    // getUserVouchers: VouchersService.getUserVouchers, // Unused: no references found in hooks
  },

  // Admin business management - ACTIVE
  admin: {
    list: BusinessManagementService.getAdminBusinessList,
    // get: BusinessManagementService.getAdminBusinessById, // Unused: no references found in hooks
    create: BusinessManagementService.createAdminBusiness,
    update: BusinessManagementService.updateAdminBusiness,
    delete: BusinessManagementService.deleteAdminBusiness,
    verify: BusinessManagementService.updateAdminBusinessVerification,
    activate: BusinessManagementService.activateAdminBusiness,
    deactivate: BusinessManagementService.deactivateAdminBusiness,
    // updateRating: BusinessManagementService.updateAdminBusinessRating, // Unused: no references found in hooks
    bulkUpdate: BusinessManagementService.bulkUpdateAdminBusinesses,
    // bulkDelete: BusinessManagementService.bulkDeleteAdminBusinesses, // Unused: no references found in hooks
  },

  // Public business API - UNUSED
  public: {
    // get: BusinessServiceService.getInternalBusinessById, // Unused: no references found in hooks
    // listByCategory: BusinessServiceService.getInternalBusinessesByCategory, // Unused: no references found in hooks
    // bulkGet: BusinessServiceService.bulkGetInternalBusinesses, // Unused: no references found in hooks
    // validate: BusinessServiceService.validateInternalBusinesses, // Unused: no references found in hooks
    // getByUser: BusinessServiceService.getInternalBusinessesByUser, // Unused: no references found in hooks
    // checkExists: BusinessServiceService.checkInternalBusinessExists, // Unused: no references found in hooks
  },
}
