import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/_services/auth.service'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Redirect based on user role
  switch (user.role) {
    case 'ADMIN':
      redirect(`/${locale}/admin/dashboard`)
    case 'BUSINESS':
      redirect(`/${locale}/business/dashboard`)
    default:
      redirect(`/${locale}/unauthorized`)
  }
}