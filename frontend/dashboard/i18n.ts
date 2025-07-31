import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { defaultLocale, isValidLocale } from './i18n/config'

export default getRequestConfig(async (context) => {
  console.log('i18n.ts: Context:', context)

  // Handle the locale - in Next.js 15, requestLocale is a Promise
  let locale = context.locale
  if (!locale && context.requestLocale) {
    console.log('i18n.ts: No locale, trying requestLocale...')
    try {
      // If locale is not provided but requestLocale is, await it
      locale = await context.requestLocale
      console.log('i18n.ts: Got locale from requestLocale:', locale)
    } catch (error) {
      console.log('i18n.ts: Error getting locale from requestLocale:', error)
    }
  }

  console.log('i18n.ts: Loading locale:', locale)

  // If still no locale, try to get it from the URL
  if (!locale) {
    // This is a fallback - in some cases next-intl might call this without proper context
    console.log('i18n.ts: No locale found, using default')
    locale = defaultLocale
  }

  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) {
    console.log('i18n.ts: Invalid locale:', locale)
    notFound()
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default
    console.log('i18n.ts: Successfully loaded messages for locale:', locale)
    return {
      locale,
      messages,
    }
  } catch (error) {
    console.log('i18n.ts: Error loading messages for locale:', locale, error)
    notFound()
  }
})
