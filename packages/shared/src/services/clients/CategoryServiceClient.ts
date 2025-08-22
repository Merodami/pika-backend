import { CATEGORY_API_URL } from '@pika/environment'
import type { CategoryDomain } from '@pika/sdk'
import type { ServiceContext, LanguageCode } from '@pika/types'

import {
  BaseServiceClient,
  type ServiceClientConfig,
} from '../BaseServiceClient.js'

/**
 * Client for communicating with the Category service
 * Can be used by any service that needs category information
 */
export class CategoryServiceClient extends BaseServiceClient {
  constructor(config?: Partial<ServiceClientConfig>) {
    super({
      serviceUrl:
        config?.serviceUrl ||
        process.env.CATEGORY_API_URL ||
        'http://localhost:5020',
      serviceName: config?.serviceName || 'CategoryServiceClient',
      ...config,
    })
  }

  /**
   * Get a category by ID with proper translations
   */
  async getCategory(
    categoryId: string,
    language?: LanguageCode,
    context?: ServiceContext,
  ): Promise<CategoryDomain | null> {
    try {
      const headers: Record<string, string> = {}
      if (language) {
        headers['Accept-Language'] = language
      }

      return await this.get<CategoryDomain>(`/internal/categories/${categoryId}`, {
        ...context,
        useServiceAuth: true,
        headers,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get multiple categories by IDs with proper translations
   */
  async getCategoriesByIds(
    categoryIds: string[],
    language?: LanguageCode,
    context?: ServiceContext,
  ): Promise<CategoryDomain[]> {
    try {
      const headers: Record<string, string> = {}
      if (language) {
        headers['Accept-Language'] = language
      }

      const response = await this.post<{ data: CategoryDomain[] }>(
        '/internal/categories/bulk',
        { categoryIds },
        {
          ...context,
          useServiceAuth: true,
          headers,
        },
      )

      return response.data
    } catch (error: any) {
      // If categories don't exist, return empty array
      if (error.context?.metadata?.status === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Check if a category exists
   */
  async categoryExists(categoryId: string, context?: ServiceContext): Promise<boolean> {
    return this.exists(`/internal/categories/${categoryId}`, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Validate multiple category IDs
   */
  async validateCategories(
    categoryIds: string[],
    context?: ServiceContext,
  ): Promise<{ valid: boolean; results: Array<{ categoryId: string; valid: boolean }> }> {
    try {
      return await this.post<{ valid: boolean; results: Array<{ categoryId: string; valid: boolean }> }>(
        '/internal/categories/validate',
        { categoryIds },
        {
          ...context,
          useServiceAuth: true,
        },
      )
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get all active categories with proper translations
   */
  async getActiveCategories(
    language?: LanguageCode,
    context?: ServiceContext,
  ): Promise<CategoryDomain[]> {
    try {
      const headers: Record<string, string> = {}
      if (language) {
        headers['Accept-Language'] = language
      }

      const response = await this.get<{ data: CategoryDomain[] }>(
        '/internal/categories/active',
        {
          ...context,
          useServiceAuth: true,
          headers,
        },
      )

      return response.data
    } catch (error: any) {
      throw error
    }
  }
}