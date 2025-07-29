import { redirect } from 'next/navigation'

import { requireAuth } from '@/app/_services/authService'
import type { Locale } from '@/i18n/config'

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await requireAuth()
  const { locale } = await params

  // Redirect based on user role
  switch (user.role) {
    case 'ADMIN':
      redirect(`/${locale}/admin`)
    case 'BUSINESS':
      redirect(`/${locale}/business`)
    default:
      // Customer role shouldn't have access to dashboard
      redirect(`/${locale}/unauthorized`)
  }
}
