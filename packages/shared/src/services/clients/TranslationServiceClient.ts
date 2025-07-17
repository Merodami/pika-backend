import { TRANSLATION_SERVICE_URL } from '@pika/environment'
import { logger } from '../utils/logger.js'
import { BaseServiceClient } from './BaseServiceClient.js'

export interface TranslationData {
  key: string
  language: string
  value: string
  context?: string
  service?: string
}

export interface TranslationBulkRequest {
  keys: string[]
  language: string
}

export interface TranslationBulkResponse {
  translations: Record<string, string>
}

export interface UserLanguagePreference {
  userId: string
  languageCode: string
}

export class TranslationServiceClient extends BaseServiceClient {
  constructor(apiKey: string) {
    super(TRANSLATION_SERVICE_URL, apiKey, 'TranslationServiceClient')
  }

  /**
   * Get a single translation
   */
  async translate(key: string, language: string): Promise<string> {
    try {
      const response = await this.get<{ translation: string }>(
        `/internal/translations/${encodeURIComponent(key)}`,
        { params: { language } }
      )
      return response.translation
    } catch (error) {
      logger.error('Failed to get translation', { key, language, error })
      return key // Return key as fallback
    }
  }

  /**
   * Get multiple translations in bulk
   */
  async translateBulk(
    keys: string[],
    language: string
  ): Promise<Record<string, string>> {
    try {
      const response = await this.post<
        TranslationBulkRequest,
        TranslationBulkResponse
      >('/internal/translations/bulk', {
        keys,
        language,
      })
      return response.translations
    } catch (error) {
      logger.error('Failed to get bulk translations', { keys, language, error })
      // Return keys as fallback
      return keys.reduce((acc, key) => {
        acc[key] = key
        return acc
      }, {} as Record<string, string>)
    }
  }

  /**
   * Create or update a translation
   */
  async createTranslation(data: TranslationData): Promise<void> {
    try {
      await this.post('/internal/translations', data)
    } catch (error) {
      logger.error('Failed to create translation', { data, error })
      throw error
    }
  }

  /**
   * Create or update multiple translations
   */
  async createTranslationsBulk(translations: TranslationData[]): Promise<void> {
    try {
      await this.post('/internal/translations/bulk-create', { translations })
    } catch (error) {
      logger.error('Failed to create bulk translations', { translations, error })
      throw error
    }
  }

  /**
   * Get user's language preference
   */
  async getUserLanguage(userId: string): Promise<string> {
    try {
      const response = await this.get<{ language: string }>(
        `/internal/users/${userId}/language`
      )
      return response.language
    } catch (error) {
      logger.error('Failed to get user language', { userId, error })
      return 'es' // Default to Spanish
    }
  }

  /**
   * Set user's language preference
   */
  async setUserLanguage(
    userId: string,
    languageCode: string
  ): Promise<void> {
    try {
      await this.put(`/internal/users/${userId}/language`, {
        languageCode,
      })
    } catch (error) {
      logger.error('Failed to set user language', { userId, languageCode, error })
      throw error
    }
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(key: string, language?: string): Promise<void> {
    try {
      const params = language ? { language } : undefined
      await this.delete(`/internal/translations/${encodeURIComponent(key)}`, {
        params,
      })
    } catch (error) {
      logger.error('Failed to delete translation', { key, language, error })
      throw error
    }
  }

  /**
   * Get all available languages
   */
  async getLanguages(): Promise<Array<{
    code: string
    name: string
    isDefault: boolean
    isActive: boolean
  }>> {
    try {
      const response = await this.get<{
        languages: Array<{
          code: string
          name: string
          isDefault: boolean
          isActive: boolean
        }>
      }>('/internal/languages')
      return response.languages
    } catch (error) {
      logger.error('Failed to get languages', { error })
      throw error
    }
  }
}