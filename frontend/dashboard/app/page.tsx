'use client'

import { Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuthStore } from '@/store/auth.store'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      router.replace('/dashboard')
    } else {
      // Redirect unauthenticated users to login
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
