import { BusinessManagementService, UserManagementService } from './generated'

/**
 * Admin API Adapter
 * Provides simplified access to admin API endpoints
 */
export const adminAdapter = {
  // Business management
  businesses: {
    // list: BusinessManagementService.getAdminBusinessList, // Unused: no references found in hooks
    get: BusinessManagementService.getAdminBusinessById,
    // create: BusinessManagementService.createAdminBusiness, // Unused: no references found in hooks
    // update: BusinessManagementService.updateAdminBusiness, // Unused: no references found in hooks
    // delete: BusinessManagementService.deleteAdminBusiness, // Unused: no references found in hooks
    // bulkUpdate: BusinessManagementService.bulkUpdateAdminBusinesses, // Unused: no references found in hooks
    // bulkDelete: BusinessManagementService.bulkDeleteAdminBusinesses, // Unused: no references found in hooks
    // activate: BusinessManagementService.activateAdminBusiness, // Unused: no references found in hooks
    // deactivate: BusinessManagementService.deactivateAdminBusiness, // Unused: no references found in hooks
    // toggleVerified: BusinessManagementService.updateAdminBusinessVerification, // Unused: no references found in hooks
    // updateRating: BusinessManagementService.updateAdminBusinessRating, // Unused: no references found in hooks
  },

  // Category management
  categories: {
    // list: CategoryServiceService.getInternalCategoryList, // Unused: no references found in hooks
    // create: CategoryManagementService.createAdminCategory, // Unused: no references found in hooks
    // get: CategoryManagementService.getAdminCategoryById, // Unused: no references found in hooks
    // update: CategoryManagementService.updateAdminCategory, // Unused: no references found in hooks
    // delete: CategoryManagementService.deleteAdminCategory, // Unused: no references found in hooks
    // bulkUpdate: CategoryManagementService.bulkUpdateAdminCategories, // Unused: no references found in hooks
    // bulkDelete: CategoryManagementService.bulkDeleteAdminCategories, // Unused: no references found in hooks
    // toggleActive: CategoryManagementService.toggleAdminCategoryActivation, // Unused: no references found in hooks
    // move: CategoryManagementService.moveAdminCategory, // Unused: no references found in hooks
    // tree: CategoryManagementService.getAdminCategoryTree, // Unused: no references found in hooks
  },

  // User management
  users: {
    list: UserManagementService.getAdminUserList,
    get: UserManagementService.getAdminUserById,
    create: UserManagementService.createAdminUser,
    update: UserManagementService.updateAdminUser,
    delete: UserManagementService.deleteAdminUser,
    // updateStatus: UserManagementService.updateAdminUserStatus, // Unused: no references found in hooks
    ban: UserManagementService.banAdminUser,
    unban: UserManagementService.unbanAdminUser,
    // getByEmail: UserManagementService.getAdminUserByEmail, // Unused: no references found in hooks
    verify: UserManagementService.verifyAdminUser,
    resendVerification: UserManagementService.resendAdminUserVerification,
    // getVerificationStatus: UserManagementService.getAdminUserVerificationStatus, // Unused: no references found in hooks
    // uploadAvatar: UserManagementService.uploadAdminUserAvatar, // Unused: no references found in hooks
    getMe: UserManagementService.getAdminCurrentUser,
    // updateMe: UserManagementService.updateAdminCurrentUser, // Unused: no references found in hooks
  },

  // Voucher management
  vouchers: {
    // list: VoucherManagementService.getAdminVoucherList, // Unused: no references found in hooks
    // create: VoucherManagementService.createAdminVoucher, // Unused: no references found in hooks
    // get: VoucherManagementService.getAdminVoucherById, // Unused: no references found in hooks
    // update: VoucherManagementService.updateAdminVoucher, // Unused: no references found in hooks
    // delete: VoucherManagementService.deleteAdminVoucher, // Unused: no references found in hooks
    // bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate, // Unused: no references found in hooks
    // analytics: VoucherManagementService.getVouchersAnalytics, // Unused: no references found in hooks
  },
}
