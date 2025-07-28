import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, localeConfig } from '@/i18n/config'

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
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Load messages for the locale
  const messages = await getMessages()
  
  // Get locale configuration
  const config = localeConfig[locale as keyof typeof localeConfig]

  return (
    <html lang={locale} dir={config.direction}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}