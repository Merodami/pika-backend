import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_services/authService'
import { UserRole } from '@pika/types'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/es/login')
  }

  switch (user.role) {
    case UserRole.ADMIN:
      redirect('/es/admin')
    case UserRole.BUSINESS:
      redirect('/es/business')
    default:
      redirect('/es/unauthorized')
  }
}
