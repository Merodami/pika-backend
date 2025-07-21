/**
 * Utility functions for type mapping and validation
 */

import { UserRole, UserStatus } from './enum.js'

/**
 * Maps any role value to UserRole enum
 * Used by all mappers to ensure consistent role mapping
 */
export function mapUserRole(role: any): UserRole {
  if (!role) return UserRole.CUSTOMER

  const roleStr = String(role).toUpperCase()

  switch (roleStr) {
    case 'ADMIN':
      return UserRole.ADMIN
    case 'CUSTOMER':
      return UserRole.CUSTOMER
    case 'BUSINESS':
      return UserRole.BUSINESS
    default:
      return UserRole.CUSTOMER
  }
}

/**
 * Maps any status value to UserStatus enum
 * Used by all mappers to ensure consistent status mapping
 */
export function mapUserStatus(status: any): UserStatus {
  if (!status) return UserStatus.ACTIVE

  const statusStr = String(status).toUpperCase()

  switch (statusStr) {
    case 'ACTIVE':
      return UserStatus.ACTIVE
    case 'SUSPENDED':
      return UserStatus.SUSPENDED
    case 'BANNED':
      return UserStatus.BANNED
    case 'UNCONFIRMED':
      return UserStatus.UNCONFIRMED
    default:
      return UserStatus.ACTIVE
  }
}

/**
 * Maps UserRole to permissions array for RBAC
 * Used by auth middleware and controllers for consistent permissions
 */
export function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        // User management
        'users:read',
        'users:write',
        'users:delete',
        // Service management
        'services:read',
        'services:write',
        'services:delete',
        // Admin specific
        'admin:dashboard',
        'admin:settings',
        'admin:users',
        'admin:system',
        // Credits management
        'credits:admin',
        'credits:manage_all',
        // Payment management
        'payments:admin',
        'payments:manage_all',
        // Business management
        'business:admin',
        'business:manage_all',
      ]
    case UserRole.BUSINESS:
      return [
        // Business user permissions
        'users:read_own',
        'users:update_own',
        // Business management
        'business:read_own',
        'business:update_own',
        'business:manage_own',
        // Credits permissions
        'credits:view_own',
        'credits:use_own',
        // Payment permissions
        'payments:own',
        'payments:purchase',
      ]
    case UserRole.CUSTOMER:
      return [
        // Basic customer permissions
        'users:read_own',
        'users:update_own',
        // Credits permissions
        'credits:view_own',
        'credits:use_own',
        'credits:transfer_own',
        // Payment permissions
        'payments:own',
        'payments:purchase',
      ]
    default:
      return []
  }
}
