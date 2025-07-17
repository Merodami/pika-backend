import type { PaginatedResult } from '@pika/types-core'

import { GetUserQuery } from '../../../application/use_cases/queries/GetUserQuery.js'
import { UserSearchQuery } from '../../../application/use_cases/queries/UserSearchQuery.js'
import { User } from '../../entities/User.js'

/**
 * UserReadRepositoryPort defines the contract for user data access in the read model.
 * Following Admin Service gold standard - returns domain entities instead of DTOs.
 * Implementations of this interface handle retrieval operations for users.
 */
export interface UserReadRepositoryPort {
  /**
   * Retrieve all users matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated user results as domain entities
   */
  getAllUsers(query: UserSearchQuery): Promise<PaginatedResult<User>>

  /**
   * Retrieve a single user by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the user domain entity or null if not found
   */
  getUserById(query: GetUserQuery): Promise<User | null>

  /**
   * Retrieve a single user by email address
   *
   * @param params - Object containing the email to search for
   * @returns Promise with the user domain entity or null if not found
   */
  getUserByEmail(params: { email: string }): Promise<User | null>
}
