import { UserRole } from '@merodami/pika-types'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { requireAuth } from '@/app/_services/authService'
import { AdminSidebar } from '@/components/layouts/adminSidebar'
import { BusinessSidebar } from '@/components/layouts/businessSidebar'
import { DashboardHeader } from '@/components/layouts/dashboardHeader'
import { LoadingSkeleton } from '@/components/ui/loadingSkeleton'
import type { Locale } from '@/i18n/config'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  // Ensure user is authenticated
  const user = await requireAuth()
  const { locale } = await params

  const Sidebar = user.role === UserRole.ADMIN ? AdminSidebar : BusinessSidebar

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and language switcher */}
      <DashboardHeader user={user} locale={locale} />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Role-based sidebar */}
        <Sidebar user={user} locale={locale} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

// Parallel route for role-specific dashboards
export async function generateMetadata({ params }: DashboardLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('dashboard.title'),
    description: t('dashboard.description'),
  }
}
