'use client'

import { Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuthStore } from '@/store/auth.store'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'BUSINESS':
          router.replace('/business/dashboard')
          break
        case 'ADMIN':
          router.replace('/admin/overview')
          break
        default:
          router.replace('/unauthorized')
      }
    }
  }, [user, isAuthenticated, router])

  return (
    <div className="flex items-center justify-center min-h-96">
      <Spin size="large" />
      <span className="ml-2">Redirecting...</span>
    </div>
  )
}
