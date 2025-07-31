import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { locales } from '@/i18n/config'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  console.log('LocaleLayout: params:', params)
  const { locale } = await params
  console.log('LocaleLayout: locale:', locale)

  // Validate locale
  if (!locales.includes(locale as (typeof locales)[number])) {
    console.log('LocaleLayout: Invalid locale:', locale)
    notFound()
  }

  // Load messages for the locale
  console.log('LocaleLayout: Before getMessages with locale:', locale)
  const messages = await getMessages({ locale })
  console.log('LocaleLayout: After getMessages')

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
