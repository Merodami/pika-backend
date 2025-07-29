import {
  BusinessManagementService,
  CategoryManagementService,
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
    list: BusinessManagementService.getBusinesses,
    create: BusinessManagementService.postBusinesses,
    update: BusinessManagementService.putBusinesses,
    delete: BusinessManagementService.deleteBusinesses,
    bulkUpdate: BusinessManagementService.patchBusinessesBulk,
    bulkDelete: BusinessManagementService.deleteBusinessesBulk,
    activate: BusinessManagementService.postBusinessesActivate,
    deactivate: BusinessManagementService.postBusinessesDeactivate,
    toggleVerified: BusinessManagementService.patchBusinessesVerification,
  },

  // Category management
  categories: {
    list: CategoryManagementService.getCategories,
    create: CategoryManagementService.postCategories,
    update: CategoryManagementService.putCategories,
    delete: CategoryManagementService.deleteCategories,
    bulkUpdate: CategoryManagementService.patchCategoriesBulkUpdate,
    bulkDelete: CategoryManagementService.deleteCategoriesBulkDelete,
    toggleActive: CategoryManagementService.patchCategoriesActivation,
    move: CategoryManagementService.patchCategoriesMove,
    tree: CategoryManagementService.getCategoriesTree,
  },

  // User management
  users: {
    list: UserManagementService.getUsers,
    create: UserManagementService.postUsers,
    bulkUpdate: UserManagementService.patchUsers,
    bulkDelete: UserManagementService.deleteUsers,
    updateStatus: UserManagementService.patchUsersStatus,
    ban: UserManagementService.putUsersBan,
    unban: UserManagementService.putUsersUnban,
    getByEmail: UserManagementService.getUsersEmail,
    verify: UserManagementService.postAdminUsersVerify,
    resendVerification: UserManagementService.postAdminUsersResendVerification,
    getVerificationStatus:
      UserManagementService.getAdminUsersVerificationStatus,
    uploadAvatar: UserManagementService.postAdminUsersAvatar,
    getMe: UserManagementService.getAdminUsersMe,
    updateMe: UserManagementService.patchAdminUsersMe,
  },

  // Voucher management
  vouchers: {
    list: VoucherManagementService.getVouchers,
    create: VoucherManagementService.postVouchers,
    get: VoucherManagementService.getVouchers1, // Auto-generated name for GET /vouchers/{id}
    update: VoucherManagementService.putVouchers,
    delete: VoucherManagementService.deleteVouchers,
    bulkUpdate: VoucherManagementService.patchVouchersBulkUpdate,
    analytics: VoucherManagementService.getVouchersAnalytics,
  },
}
