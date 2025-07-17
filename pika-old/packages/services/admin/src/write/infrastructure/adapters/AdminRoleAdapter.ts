import { AdminRole } from '@admin-write/domain/entities/Admin.js'
import { UserRole } from '@prisma/client'

/**
 * Adapter to handle role mapping between Admin domain model and User database model
 * Since User table only has ADMIN role, we store detailed admin roles in metadata
 */
export class AdminRoleAdapter {
  /**
   * Maps AdminRole to UserRole for database storage
   * All admin roles map to UserRole.ADMIN in the database
   */
  static toDatabaseRole(): UserRole {
    // All admin types are stored as ADMIN in User table
    // The specific admin role is stored in metadata
    return UserRole.ADMIN
  }

  /**
   * Extracts the actual AdminRole from metadata
   * Falls back to PLATFORM_ADMIN if not specified
   */
  static fromMetadata(metadata: any): AdminRole {
    const adminRole = metadata?.adminRole

    // Validate it's a valid AdminRole
    if (adminRole && Object.values(AdminRole).includes(adminRole)) {
      return adminRole as AdminRole
    }

    // Default to PLATFORM_ADMIN for backwards compatibility
    return AdminRole.PLATFORM_ADMIN
  }

  /**
   * Stores the AdminRole in metadata
   */
  static toMetadata(role: AdminRole, existingMetadata: any = {}): any {
    return {
      ...existingMetadata,
      adminRole: role,
    }
  }
}