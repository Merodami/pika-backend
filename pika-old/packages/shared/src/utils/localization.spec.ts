import { LocalizationConfig } from '@pika/types-core'
import { describe, expect, it } from 'vitest'

import { processMultilingualContent } from './localization.js'

interface TestEntity {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  price: number
  active: boolean
}

const testConfig: LocalizationConfig<TestEntity> = {
  multilingualFields: ['title', 'description'],
}

describe('localization', () => {
  const testData: TestEntity = {
    id: '123',
    title: {
      es: 'Título en español',
      en: 'Title in English',
      gn: 'Título en guaraní',
    },
    description: {
      es: 'Descripción en español',
      en: 'Description in English',
      gn: 'Descripción en guaraní',
    },
    price: 100,
    active: true,
  }

  describe('processMultilingualContent', () => {
    it('should return all languages when languagePreference is "all"', () => {
      const result = processMultilingualContent(testData, testConfig, 'all')

      expect(result.title).toEqual({
        es: 'Título en español',
        en: 'Title in English',
        gn: 'Título en guaraní',
      })
      expect(result.description).toEqual({
        es: 'Descripción en español',
        en: 'Description in English',
        gn: 'Descripción en guaraní',
      })
    })

    it('should return object with only requested language when specific language is provided', () => {
      const result = processMultilingualContent(testData, testConfig, 'es')

      expect(result.title).toEqual({
        es: 'Título en español',
      })
      expect(result.description).toEqual({
        es: 'Descripción en español',
      })
      expect(result.price).toBe(100)
      expect(result.active).toBe(true)
    })

    it('should return object with only English when "en" is requested', () => {
      const result = processMultilingualContent(testData, testConfig, 'en')

      expect(result.title).toEqual({
        en: 'Title in English',
      })
      expect(result.description).toEqual({
        en: 'Description in English',
      })
    })

    it('should use fallback language when requested language is not available', () => {
      const dataWithMissingLang: TestEntity = {
        ...testData,
        title: {
          es: 'Solo español',
          en: 'Only English',
        },
      }

      const result = processMultilingualContent(
        dataWithMissingLang,
        testConfig,
        'gn',
        'es',
      )

      expect(result.title).toEqual({
        gn: 'Solo español', // Falls back to Spanish
      })
    })

    it('should handle array of entities', () => {
      const dataArray = [testData, { ...testData, id: '456' }]

      const results = dataArray.map((item) =>
        processMultilingualContent(item, testConfig, 'es'),
      )

      expect(results).toHaveLength(2)
      expect(results[0].title).toEqual({ es: 'Título en español' })
      expect(results[1].title).toEqual({ es: 'Título en español' })
    })
  })
})
