import { CATEGORY_API_URL } from '@pika/environment'
import type { CategoryDomain } from '@pika/sdk'
import type { LanguageCode, ServiceContext } from '@pika/types'

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
      serviceUrl: config?.serviceUrl || CATEGORY_API_URL,
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

      const response = await this.request<CategoryDomain>(
        `/internal/categories/${categoryId}`,
        {
          method: 'GET',
          headers,
          useServiceAuth: true,
        },
        context,
      )

      return response
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
    const headers: Record<string, string> = {}

    if (language) {
      headers['Accept-Language'] = language
    }

    const response = await this.request<{ data: CategoryDomain[] }>(
      '/internal/categories/bulk',
      {
        method: 'POST',
        body: { categoryIds },
        headers,
        useServiceAuth: true,
      },
      context,
    )

    return response.data
  }

  /**
   * Check if a category exists
   */
  async categoryExists(
    categoryId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
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
  ): Promise<{
    valid: boolean
    results: Array<{ categoryId: string; valid: boolean }>
  }> {
    return await this.post<{
      valid: boolean
      results: Array<{ categoryId: string; valid: boolean }>
    }>(
      '/internal/categories/validate',
      { categoryIds },
      {
        ...context,
        useServiceAuth: true,
      },
    )
  }

  /**
   * Get all active categories with proper translations
   */
  async getActiveCategories(
    language?: LanguageCode,
    context?: ServiceContext,
  ): Promise<CategoryDomain[]> {
    const headers: Record<string, string> = {}

    if (language) {
      headers['Accept-Language'] = language
    }

    const response = await this.request<{ data: CategoryDomain[] }>(
      '/internal/categories/active',
      {
        method: 'GET',
        headers,
        useServiceAuth: true,
      },
      context,
    )

    return response.data
  }
}
