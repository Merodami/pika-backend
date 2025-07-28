import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  // Determine the locale
  let locale = await requestLocale

  // Validate locale
  if (!locale || !isValidLocale(locale)) {
    // Try to get from cookie
    const cookieStore = await cookies()
    const savedLocale = cookieStore.get('pika-locale')?.value

    if (savedLocale && isValidLocale(savedLocale)) {
      locale = savedLocale
    } else {
      locale = defaultLocale
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Optional: Configure time zone, formats, etc.
    timeZone: 'America/Asuncion', // Paraguay timezone
    now: new Date(),
  }
})
