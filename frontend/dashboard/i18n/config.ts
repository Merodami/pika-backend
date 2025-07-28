export const locales = ['es', 'en', 'gn'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

export const localeConfig = {
  es: {
    name: 'Español',
    flag: '🇪🇸',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    direction: 'ltr' as const,
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    direction: 'ltr' as const,
  },
  gn: {
    name: 'Guaraní',
    flag: '🇵🇾',
    currency: 'PYG',
    dateFormat: 'dd/MM/yyyy',
    direction: 'ltr' as const,
  },
} as const

export function getLocaleConfig(locale: Locale) {
  return localeConfig[locale]
}

// Check if a string is a valid locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}