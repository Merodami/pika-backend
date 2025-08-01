import { UserRole } from '@merodami/pika-types'
import { redirect } from 'next/navigation'

import { requireAuth } from '@/app/_services/authService'
import type { Locale } from '@/i18n/config'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await requireAuth()
  const { locale } = await params

  switch (user.role) {
    case UserRole.ADMIN:
      redirect(`/${locale}/admin`)
      break
    case UserRole.BUSINESS:
      redirect(`/${locale}/business`)
      break
    default:
      redirect(`/${locale}/unauthorized`)
  }
}
