import { Ticket, Users, TrendingUp, QrCode } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { MetricCard } from '@/components/ui/metricCard'
import type { LocaleProps } from '@/types/common'

interface BusinessDashboardMetricsProps extends LocaleProps {
  businessId: string
}

export async function BusinessDashboardMetrics({
  locale,
}: BusinessDashboardMetricsProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard.metrics' })

  // Fetch business-specific metrics
  // In production, these would come from the API
  const metrics = {
    activeVouchers: 8,
    totalRedemptions: 234,
    totalScans: 567,
    uniqueCustomers: 89,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title={t('activeVouchers')}
        value={metrics.activeVouchers.toString()}
        icon={Ticket}
        trend={{ value: 5.2, isPositive: true }}
      />
      <MetricCard
        title={t('totalRedemptions')}
        value={metrics.totalRedemptions.toLocaleString()}
        icon={TrendingUp}
        trend={{ value: 12.8, isPositive: true }}
      />
      <MetricCard
        title={t('totalScans')}
        value={metrics.totalScans.toLocaleString()}
        icon={QrCode}
        trend={{ value: 18.3, isPositive: true }}
      />
      <MetricCard
        title={t('uniqueCustomers')}
        value={metrics.uniqueCustomers.toString()}
        icon={Users}
        trend={{ value: 22.5, isPositive: true }}
      />
    </div>
  )
}
