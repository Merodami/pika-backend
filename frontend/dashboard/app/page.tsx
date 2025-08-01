import { UserRole } from '@merodami/pika-types'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_services/authService'
import { defaultLocale } from '@/i18n/config'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${defaultLocale}/login`)
  }

  switch (user.role) {
    case UserRole.ADMIN:
      redirect(`/${defaultLocale}/admin`)
      break
    case UserRole.BUSINESS:
      redirect(`/${defaultLocale}/business`)
      break
    default:
      redirect(`/${defaultLocale}/unauthorized`)
  }
}
