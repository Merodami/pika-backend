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
    list: BusinessManagementService.getBusinessesAdminBusinesses,
    get: BusinessManagementService.getBusinessesAdminBusinessesId,
    create: BusinessManagementService.postBusinessesAdminBusinesses,
    update: BusinessManagementService.putBusinessesAdminBusinessesId,
    delete: BusinessManagementService.deleteBusinessesAdminBusinessesId,
    bulkUpdate: BusinessManagementService.putBusinessesAdminBusinessesBulk,
    bulkDelete: BusinessManagementService.deleteBusinessesAdminBusinessesBulk,
    toggleActive: BusinessManagementService.patchBusinessesAdminBusinessesIdToggleActive,
    toggleVerified: BusinessManagementService.patchBusinessesAdminBusinessesIdToggleVerified,
  },

  // Category management
  categories: {
    list: CategoryManagementService.getCategoriesAdminCategories,
    get: CategoryManagementService.getCategoriesAdminCategoriesId,
    create: CategoryManagementService.postCategoriesAdminCategories,
    update: CategoryManagementService.putCategoriesAdminCategoriesId,
    delete: CategoryManagementService.deleteCategoriesAdminCategoriesId,
    bulkUpdate: CategoryManagementService.putCategoriesAdminCategoriesBulk,
    bulkDelete: CategoryManagementService.deleteCategoriesAdminCategoriesBulk,
    toggleActive: CategoryManagementService.patchCategoriesAdminCategoriesIdToggleActive,
    updateSort: CategoryManagementService.putCategoriesAdminCategoriesSort,
    tree: CategoryManagementService.getCategoriesAdminCategoriesTree,
  },

  // User management
  users: {
    list: UserManagementService.getUsersAdminUsers,
    get: UserManagementService.getUsersAdminUsersId,
    create: UserManagementService.postUsersAdminUsers,
    update: UserManagementService.putUsersAdminUsersId,
    ban: UserManagementService.postUsersAdminUsersIdBan,
    unban: UserManagementService.postUsersAdminUsersIdUnban,
    uploadAvatar: UserManagementService.postUsersAdminUsersIdAvatar,
    verify: UserManagementService.postUsersAdminUsersIdVerify,
    stats: UserManagementService.getUsersAdminUsersIdStats,
    activity: UserManagementService.getUsersAdminUsersIdActivity,
    bulkAction: UserManagementService.postUsersAdminUsersBulk,
  },

  // Voucher management
  vouchers: {
    list: VoucherManagementService.getVouchersAdminVouchers,
    get: VoucherManagementService.getVouchersAdminVouchersId,
    update: VoucherManagementService.putVouchersAdminVouchersId,
    delete: VoucherManagementService.deleteVouchersAdminVouchersId,
    bulkUpdate: VoucherManagementService.putVouchersAdminVouchersBulk,
    analytics: VoucherManagementService.getVouchersAdminVouchersIdAnalytics,
  },

  // Voucher book management
  voucherBooks: {
    list: VoucherManagementService.getVouchersAdminVoucherBooks,
    get: VoucherManagementService.getVouchersAdminVoucherBooksId,
    update: VoucherManagementService.putVouchersAdminVoucherBooksId,
    delete: VoucherManagementService.deleteVouchersAdminVoucherBooksId,
    bulkOperation: VoucherManagementService.postVouchersAdminVoucherBooksBulk,
    details: VoucherManagementService.getVouchersAdminVoucherBooksIdDetails,
  },
}