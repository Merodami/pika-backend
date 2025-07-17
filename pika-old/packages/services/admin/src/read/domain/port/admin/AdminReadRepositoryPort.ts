import { AdminSearchQuery } from '@admin-read/domain/dtos/AdminDTO.js'
import { Admin } from '@admin-read/domain/entities/Admin.js'
import type { PaginatedResult } from '@pika/types-core'

/**
 * Get Admin Query interface
 */
export interface GetAdminQuery {
  id: string
  includePermissions?: boolean
}

/**
 * AdminReadRepositoryPort defines the contract for admin data access in the read model.
 * Implementations of this interface handle retrieval operations for admins.
 */
export interface AdminReadRepositoryPort {
  /**
   * Retrieve all admins matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated admin results
   */
  getAllAdmins(query: AdminSearchQuery): Promise<PaginatedResult<Admin>>

  /**
   * Retrieve a single admin by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the admin or null if not found
   */
  getAdminById(query: GetAdminQuery): Promise<Admin | null>

  /**
   * Retrieve an admin by user ID
   *
   * @param userId - The user ID to search for
   * @returns Promise with the admin or null if not found
   */
  getAdminByUserId(userId: string): Promise<Admin | null>

  /**
   * Check if a user has admin privileges
   *
   * @param userId - The user ID to check
   * @returns Promise with boolean indicating admin status
   */
  isUserAdmin(userId: string): Promise<boolean>
}
