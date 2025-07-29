import {
  BusinessManagementService,
  CategoryManagementService,
  CategoryServiceService,
  UserManagementService,
  VoucherManagementService,
} from './generated'

/**
 * Admin API Adapter
 * Provides simplified access to admin API endpoints
 */
export const adminAdapter = {
  // Business management
  businesses: {
    list: BusinessManagementService.getAdminBusinessList,
    get: BusinessManagementService.getAdminBusinessById,
    create: BusinessManagementService.createAdminBusiness,
    update: BusinessManagementService.updateAdminBusiness,
    delete: BusinessManagementService.deleteAdminBusiness,
    bulkUpdate: BusinessManagementService.bulkUpdateAdminBusinesses,
    bulkDelete: BusinessManagementService.bulkDeleteAdminBusinesses,
    activate: BusinessManagementService.activateAdminBusiness,
    deactivate: BusinessManagementService.deactivateAdminBusiness,
    toggleVerified: BusinessManagementService.updateAdminBusinessVerification,
    updateRating: BusinessManagementService.updateAdminBusinessRating,
  },

  // Category management
  categories: {
    list: CategoryServiceService.getInternalCategoryList,
    create: CategoryManagementService.createAdminCategory,
    get: CategoryManagementService.getAdminCategoryById,
    update: CategoryManagementService.updateAdminCategory,
    delete: CategoryManagementService.deleteAdminCategory,
    bulkUpdate: CategoryManagementService.bulkUpdateAdminCategories,
    bulkDelete: CategoryManagementService.bulkDeleteAdminCategories,
    toggleActive: CategoryManagementService.toggleAdminCategoryActivation,
    move: CategoryManagementService.moveAdminCategory,
    tree: CategoryManagementService.getAdminCategoryTree,
  },

  // User management
  users: {
    list: UserManagementService.getAdminUserList,
    get: UserManagementService.getAdminUserById,
    create: UserManagementService.createAdminUser,
    update: UserManagementService.updateAdminUser,
    delete: UserManagementService.deleteAdminUser,
    updateStatus: UserManagementService.updateAdminUserStatus,
    ban: UserManagementService.banAdminUser,
    unban: UserManagementService.unbanAdminUser,
    getByEmail: UserManagementService.getAdminUserByEmail,
    verify: UserManagementService.verifyAdminUser,
    resendVerification: UserManagementService.resendAdminUserVerification,
    getVerificationStatus: UserManagementService.getAdminUserVerificationStatus,
    uploadAvatar: UserManagementService.uploadAdminUserAvatar,
    getMe: UserManagementService.getAdminCurrentUser,
    updateMe: UserManagementService.updateAdminCurrentUser,
  },

  // Voucher management
  vouchers: {
    list: VoucherManagementService.getAdminVoucherList,
    create: VoucherManagementService.createAdminVoucher,
    get: VoucherManagementService.getAdminVoucherById,
    update: VoucherManagementService.updateAdminVoucher,
    delete: VoucherManagementService.deleteAdminVoucher,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,
  },
}
