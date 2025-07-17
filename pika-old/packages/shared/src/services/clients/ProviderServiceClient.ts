import { PROVIDER_API_URL } from '@pika/environment'
import type { ServiceContext } from '@pika/types-core'

import { BaseServiceClient } from '../BaseServiceClient.js'

export interface Provider {
  id: string
  userId: string
  businessName: Record<string, string>
  businessDescription: Record<string, string>
  categoryId: string
  phoneNumber?: string
  email?: string
  website?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  serviceAreas?: string[]
  businessHours?: Record<string, any>
  verified: boolean
  active: boolean
  avgRating: number
  totalReviews?: number
  createdAt: string
  updatedAt: string
}

/**
 * Client for communicating with the Provider service
 * Can be used by any service that needs provider information
 */
export class ProviderServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = PROVIDER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'ProviderServiceClient',
    })
  }

  /**
   * Get a provider by ID
   */
  async getProvider(
    providerId: string,
    context?: ServiceContext,
  ): Promise<Provider | null> {
    try {
      return await this.get<Provider>(`/api/v1/providers/${providerId}`, {
        ...context,
        useServiceAuth: true, // Enable service-to-service authentication
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get provider by user ID
   * Uses internal service-to-service endpoint
   */
  async getProviderByUserId(
    userId: string,
    context?: ServiceContext,
  ): Promise<Provider | null> {
    try {
      return await this.get<Provider>(`/internal/users/${userId}/provider`, {
        useServiceAuth: true, // Enable service-to-service authentication
        context,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if a provider exists
   */
  async providerExists(
    providerId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    return this.exists(`/api/v1/providers/${providerId}`, {
      ...context,
      useServiceAuth: true, // Enable service-to-service authentication
    })
  }

  /**
   * Check if a user has an active provider profile
   */
  async isUserActiveProvider(
    userId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    try {
      const provider = await this.getProviderByUserId(userId, context)

      return provider !== null && provider.active
    } catch (error: any) {
      // Log error but return false instead of throwing
      console.error('Error checking if user is active provider:', error)

      return false
    }
  }

  /**
   * Get provider ID by user ID
   * Returns null if user is not a provider
   */
  async getProviderIdByUserId(
    userId: string,
    context?: ServiceContext,
  ): Promise<string | null> {
    const provider = await this.getProviderByUserId(userId, context)

    return provider?.id || null
  }
}
