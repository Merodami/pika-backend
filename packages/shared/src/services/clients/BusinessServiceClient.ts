import type { BusinessDomain } from '@pika/sdk'
import type { ServiceContext } from '@pika/types'

import {
  BaseServiceClient,
  type ServiceClientConfig,
} from '../BaseServiceClient.js'

/**
 * Client for interacting with the Business Service
 * Handles all business-related operations through internal APIs
 */
export class BusinessServiceClient extends BaseServiceClient {
  constructor(config?: Partial<ServiceClientConfig>) {
    super({
      serviceUrl:
        config?.serviceUrl ||
        process.env.BUSINESS_API_URL ||
        'http://localhost:5028',
      serviceName: config?.serviceName || 'BusinessServiceClient',
      ...config,
    })
  }

  /**
   * Get a single business by ID
   */
  async getBusiness(
    businessId: string,
    options?: { includeUser?: boolean; includeCategory?: boolean },
    context?: ServiceContext,
  ): Promise<BusinessDomain> {
    const queryParams = new URLSearchParams()

    if (options?.includeUser) queryParams.append('includeUser', 'true')
    if (options?.includeCategory) queryParams.append('includeCategory', 'true')

    const path = queryParams.toString()
      ? `/internal/businesses/${businessId}?${queryParams.toString()}`
      : `/internal/businesses/${businessId}`

    return this.get<BusinessDomain>(path, {
      context,
      useServiceAuth: true,
    })
  }

  /**
   * Get business by user ID (returns single business)
   */
  async getBusinessByUserId(
    userId: string,
    options?: { includeUser?: boolean; includeCategory?: boolean },
    context?: ServiceContext,
  ): Promise<BusinessDomain> {
    const queryParams = new URLSearchParams()

    if (options?.includeUser) queryParams.append('includeUser', 'true')
    if (options?.includeCategory) queryParams.append('includeCategory', 'true')

    const path = queryParams.toString()
      ? `/internal/businesses/user/${userId}?${queryParams.toString()}`
      : `/internal/businesses/user/${userId}`

    return this.get<BusinessDomain>(path, {
      context,
      useServiceAuth: true,
    })
  }

  /**
   * Get all businesses by user ID (returns array of businesses)
   */
  async getBusinessesByUserId(
    userId: string,
    options?: {
      includeUser?: boolean
      includeCategory?: boolean
      page?: number
      limit?: number
      onlyActive?: boolean
      onlyVerified?: boolean
      include?: string
    },
    context?: ServiceContext,
  ): Promise<BusinessDomain[]> {
    const queryParams = new URLSearchParams()

    if (options?.includeUser) queryParams.append('includeUser', 'true')
    if (options?.includeCategory) queryParams.append('includeCategory', 'true')
    if (options?.page) queryParams.append('page', options.page.toString())
    if (options?.limit) queryParams.append('limit', options.limit.toString())
    if (options?.onlyActive !== undefined)
      queryParams.append('onlyActive', options.onlyActive.toString())
    if (options?.onlyVerified !== undefined)
      queryParams.append('onlyVerified', options.onlyVerified.toString())
    if (options?.include) queryParams.append('include', options.include)

    const path = queryParams.toString()
      ? `/internal/businesses/user/${userId}/all?${queryParams.toString()}`
      : `/internal/businesses/user/${userId}/all`

    const response = await this.get<{
      data: BusinessDomain[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(path, {
      context,
      useServiceAuth: true,
    })

    return response.data
  }

  /**
   * Get multiple businesses by their IDs (batch operation)
   */
  async getBusinessesByIds(
    businessIds: string[],
    context?: ServiceContext,
  ): Promise<BusinessDomain[]> {
    const response = await this.post<{ businesses: BusinessDomain[] }>(
      '/internal/businesses/batch',
      { businessIds },
      { ...context, useServiceAuth: true },
    )

    return response.businesses
  }

  /**
   * Get businesses by category
   */
  async getBusinessesByCategory(
    categoryId: string,
    options?: {
      page?: number
      limit?: number
      search?: string
      isActive?: boolean
    },
    context?: ServiceContext,
  ): Promise<{ businesses: BusinessDomain[]; total: number }> {
    const queryParams = new URLSearchParams()

    if (options?.page) queryParams.append('page', options.page.toString())
    if (options?.limit) queryParams.append('limit', options.limit.toString())
    if (options?.search) queryParams.append('search', options.search)
    if (options?.isActive !== undefined)
      queryParams.append('isActive', options.isActive.toString())

    const path = queryParams.toString()
      ? `/internal/businesses/category/${categoryId}?${queryParams.toString()}`
      : `/internal/businesses/category/${categoryId}`

    return this.get<{ businesses: BusinessDomain[]; total: number }>(path, {
      context,
      useServiceAuth: true,
    })
  }

  /**
   * Check if a business exists
   */
  async businessExists(
    businessId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    try {
      await this.getBusiness(businessId, undefined, context)

      return true
    } catch (error: any) {
      if (error.code === 'BUSINESS_NOT_FOUND' || error.status === 404) {
        return false
      }
      throw error
    }
  }
}
