import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { isValidLocale } from './i18n/config'

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !isValidLocale(locale)) notFound()

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})