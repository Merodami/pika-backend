import { UserRole } from '@pika/types'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_services/authService'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

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
