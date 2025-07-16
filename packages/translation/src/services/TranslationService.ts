import type { Request } from 'express'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import type { ITranslationRepository } from '../repositories/TranslationRepository.js'
import type { ITranslationCache } from './TranslationCache.js'

export interface ITranslationService {
  get(key: string, language: string, fallback?: string): Promise<string>
  getBulk(keys: string[], language: string): Promise<Record<string, string>>
  set(key: string, language: string, value: string, context?: string, service?: string): Promise<void>
  detectLanguage(request: Request): Promise<string>
  getUserLanguage(userId: string): Promise<string>
  setUserLanguage(userId: string, languageCode: string): Promise<void>
}

export class TranslationService implements ITranslationService {
  constructor(
    private readonly repository: ITranslationRepository,
    private readonly cache: ITranslationCache,
    private readonly defaultLanguage: string = DEFAULT_LANGUAGE
  ) {}

  async get(key: string, language: string, fallback?: string): Promise<string> {
    // 1. Check cache
    const cached = await this.cache.get(key, language)
    if (cached) return cached

    // 2. Check database
    const translation = await this.repository.findByKeyAndLanguage(key, language)
    if (translation) {
      await this.cache.set(key, language, translation.value)
      return translation.value
    }

    // 3. Try default language
    if (language !== this.defaultLanguage) {
      const defaultTrans = await this.get(key, this.defaultLanguage)
      if (defaultTrans !== key) return defaultTrans
    }

    // 4. Return fallback or key
    return fallback || key
  }

  async getBulk(keys: string[], language: string): Promise<Record<string, string>> {
    const results: Record<string, string> = {}
    const uncachedKeys: string[] = []

    // Check cache first
    for (const key of keys) {
      const cached = await this.cache.get(key, language)
      if (cached) {
        results[key] = cached
      } else {
        uncachedKeys.push(key)
      }
    }

    // Fetch uncached from database
    if (uncachedKeys.length > 0) {
      const translations = await this.repository.findByKeysAndLanguage(uncachedKeys, language)
      
      for (const trans of translations) {
        results[trans.key] = trans.value
        await this.cache.set(trans.key, language, trans.value)
      }

      // Handle missing keys with fallback
      for (const key of uncachedKeys) {
        if (!results[key]) {
          // Try default language
          if (language !== this.defaultLanguage) {
            const defaultTrans = await this.get(key, this.defaultLanguage)
            results[key] = defaultTrans
          } else {
            results[key] = key // Return key as fallback
          }
        }
      }
    }

    return results
  }

  async set(key: string, language: string, value: string, context?: string, service?: string): Promise<void> {
    // Create or update translation
    const existing = await this.repository.findByKeyAndLanguage(key, language)
    
    if (existing) {
      await this.repository.update(existing.id, { value, context, service })
    } else {
      await this.repository.create({ key, value, languageCode: language, context, service })
    }

    // Update cache
    await this.cache.set(key, language, value)
  }

  async detectLanguage(request: Request): Promise<string> {
    // 1. Check user preference header
    const userLang = request.headers['x-user-language'] as string
    if (userLang && await this.isValidLanguage(userLang)) {
      return userLang
    }

    // 2. Check query parameter
    const queryLang = request.query.lang as string
    if (queryLang && await this.isValidLanguage(queryLang)) {
      return queryLang
    }

    // 3. Parse Accept-Language header
    const acceptLang = request.headers['accept-language']
    if (acceptLang) {
      const preferredLang = this.parseAcceptLanguage(acceptLang)
      if (preferredLang && await this.isValidLanguage(preferredLang)) {
        return preferredLang
      }
    }

    // 4. Return default
    return this.defaultLanguage
  }

  async getUserLanguage(userId: string): Promise<string> {
    const preference = await this.repository.findUserLanguagePreference(userId)
    return preference?.languageCode || this.defaultLanguage
  }

  async setUserLanguage(userId: string, languageCode: string): Promise<void> {
    // Validate language exists and is active
    const language = await this.repository.findLanguageByCode(languageCode)
    if (!language || !language.isActive) {
      throw new Error(`Language ${languageCode} is not available`)
    }

    await this.repository.setUserLanguagePreference(userId, languageCode)
  }

  private parseAcceptLanguage(acceptLanguage: string): string | null {
    // Simple parsing - take first language
    const languages = acceptLanguage.split(',')
    if (languages.length > 0) {
      const lang = languages[0].split(';')[0].split('-')[0].trim()
      return lang
    }
    return null
  }

  private async isValidLanguage(code: string): Promise<boolean> {
    const language = await this.repository.findLanguageByCode(code)
    return language !== null && language.isActive
  }
}