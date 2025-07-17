import { USER_API_URL } from '@pika/environment'
import type { ServiceContext } from '@pika/types-core'

import { BaseServiceClient } from '../BaseServiceClient.js'

export interface User {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber?: string
  phoneVerified: boolean
  avatarUrl?: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Client for communicating with the User service
 * Can be used by any service that needs user or provider information
 */
export class UserServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = USER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'UserServiceClient',
    })
  }

  /**
   * Get a user by ID
   */
  async getUser(
    userId: string,
    context?: ServiceContext,
  ): Promise<User | null> {
    try {
      return await this.get<User>(`/users/${userId}`, context)
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if a user exists
   */
  async userExists(userId: string, context?: ServiceContext): Promise<boolean> {
    return this.exists(`/users/${userId}`, context)
  }

  /**
   * Check if a user exists and has PROVIDER role
   */
  async isProvider(userId: string, context?: ServiceContext): Promise<boolean> {
    try {
      const user = await this.getUser(userId, context)

      return user !== null && user.role === 'PROVIDER'
    } catch (error: any) {
      // Log error but return false instead of throwing
      console.error('Error checking if user is service provider:', error)

      return false
    }
  }
}
