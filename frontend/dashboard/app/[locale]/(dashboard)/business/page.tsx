import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { requireBusiness } from '@/app/_services/authService'
import { BusinessDashboardMetrics } from '@/components/features/businessDashboardMetrics'
import { VoucherPerformance } from '@/components/features/voucherPerformance'
import { RecentCustomers } from '@/components/features/recentCustomers'
import { LoadingSkeleton } from '@/components/ui/loadingSkeleton'
import type { Locale } from '@/i18n/config'

interface BusinessDashboardPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function BusinessDashboardPage({
  params,
}: BusinessDashboardPageProps) {
  const user = await requireBusiness()
  // TODO: Fetch businessId from business service
  const businessId = 'placeholder-business-id'
  const { locale } = await params
  const t = await getTranslations({ locale })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome', { name: user.firstName })}
        </h1>
        <p className="text-gray-600 mt-1">{t('dashboard.business.subtitle')}</p>
      </div>

      {/* Business Metrics */}
      <Suspense fallback={<LoadingSkeleton />}>
        <BusinessDashboardMetrics businessId={businessId} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voucher Performance */}
        <Suspense fallback={<LoadingSkeleton />}>
          <VoucherPerformance businessId={businessId} />
        </Suspense>

        {/* Recent Customers */}
        <Suspense fallback={<LoadingSkeleton />}>
          <RecentCustomers />
        </Suspense>
      </div>
    </div>
  )
}
