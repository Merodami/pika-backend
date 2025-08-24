/**
 * UserMapper for Social Authentication
 * Maps user data for authentication responses
 */

import type { User } from '@prisma/client'

export interface AuthUserDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  profilePicture?: string
  role: string
}

export class UserMapper {
  /**
   * Convert user entity to authentication DTO
   */
  static toAuthDTO(user: User | any): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture || undefined,
      role: user.role,
    }
  }
}
