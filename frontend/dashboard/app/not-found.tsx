import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n/config'

// Root not-found redirects to default locale
export default function RootNotFound() {
  redirect(`/${defaultLocale}`)
}
