import { redirect } from 'next/navigation'

import { requireAuth } from '@/app/_services/authService'
import type { Locale } from '@/i18n/config'
import { UserRole } from '@pika/types'

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await requireAuth()
  const { locale } = await params

  switch (user.role) {
    case UserRole.ADMIN:
      redirect(`/${locale}/admin`)
    case UserRole.BUSINESS:
      redirect(`/${locale}/business`)
    default:
      redirect(`/${locale}/unauthorized`)
  }
}
