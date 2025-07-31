import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { requireAdmin } from '@/app/_services/authService'
import { AdminDashboardMetrics } from '@/components/features/adminDashboardMetrics'
import { RecentActivityFeed } from '@/components/features/recentActivityFeed'
import { SystemHealthStatus } from '@/components/features/systemHealthStatus'
import { LoadingSkeleton } from '@/components/ui/loadingSkeleton'
import type { Locale } from '@/i18n/config'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

interface AdminDashboardPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const user = await requireAdmin()
  const { locale } = await params
  const t = await getTranslations({ locale })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome', { name: user.firstName })}
        </h1>
        <p className="text-gray-600 mt-1">{t('dashboard.admin.subtitle')}</p>
      </div>

      {/* Metrics Overview */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AdminDashboardMetrics locale={locale} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSkeleton />}>
            <RecentActivityFeed locale={locale} />
          </Suspense>
        </div>

        {/* System Health */}
        <div>
          <Suspense fallback={<LoadingSkeleton />}>
            <SystemHealthStatus locale={locale} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
