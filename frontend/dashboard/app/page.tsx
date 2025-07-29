import { UserRole } from '@pika/types'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_services/authService'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/es/login')
  }

  switch (user.role) {
    case UserRole.ADMIN:
      redirect('/es/admin')
      break
    case UserRole.BUSINESS:
      redirect('/es/business')
      break
    default:
      redirect('/es/unauthorized')
  }
}
