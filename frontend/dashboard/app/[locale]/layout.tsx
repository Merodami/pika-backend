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
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  // Load messages for the locale
  const messages = await getMessages()

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
