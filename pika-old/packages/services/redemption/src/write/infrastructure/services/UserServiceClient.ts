import { USER_API_URL } from '@pika/environment'
import { logger } from '@pika/shared'

export interface UserServicePort {
  getProviderName(providerId: string): Promise<string>
}

/**
 * HTTP client for communicating with the User Service
 * Used to fetch provider information
 */
export class UserServiceClient implements UserServicePort {
  private readonly userServiceUrl: string
  private readonly providerNameCache: Map<string, string> = new Map()

  constructor(userServiceUrl: string = USER_API_URL) {
    this.userServiceUrl = userServiceUrl
  }

  /**
   * Get provider name from the user service
   * Includes simple in-memory caching
   */
  async getProviderName(providerId: string): Promise<string> {
    // Check cache first
    if (this.providerNameCache.has(providerId)) {
      return this.providerNameCache.get(providerId)!
    }

    try {
      const response = await fetch(
        `${this.userServiceUrl}/users/${providerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        logger.warn('Failed to fetch provider info', {
          providerId,
          status: response.status,
        })

        return 'Provider'
      }

      const data = await response.json()
      const providerName = data.business_name || data.name || 'Provider'

      // Cache the result
      this.providerNameCache.set(providerId, providerName)

      return providerName
    } catch (error) {
      logger.error('Error fetching provider name', { error, providerId })

      // Return default on error to not break redemption flow
      return 'Provider'
    }
  }
}
