import { createSortFieldMapper } from '@api/common/utils/sorting.js'

import { AdminUserSortBy, UserSortBy } from './enums.js'

/**
 * Maps public API sort fields to database column names
 */
export const userSortFieldMapper = createSortFieldMapper(UserSortBy, {
  name: 'firstName', // Maps 'name' to firstName for sorting
  email: 'email',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLogin: 'lastLoginAt',
})

/**
 * Maps admin API sort fields to database column names
 */
export const adminUserSortFieldMapper = createSortFieldMapper(AdminUserSortBy, {
  createdAt: 'createdAt',
  lastLoginAt: 'lastLoginAt',
  email: 'email',
})
