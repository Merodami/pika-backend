import { getTranslations } from 'next-intl/server'
import { Ticket, Users, TrendingUp, DollarSign } from 'lucide-react'

import { MetricCard } from '@/components/ui/metricCard'

interface BusinessDashboardMetricsProps {
  businessId: string
}

export async function BusinessDashboardMetrics({ businessId }: BusinessDashboardMetricsProps) {
  const t = await getTranslations('dashboard.metrics')

  // Fetch business-specific metrics
  const metrics = {
    activeVouchers: 12,
    totalRedemptions: 234,
    monthlyRevenue: 4567.89,
    newCustomers: 45,
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
        title={t('revenue')}
        value={`$${metrics.monthlyRevenue.toLocaleString()}`}
        icon={DollarSign}
        trend={{ value: 8.3, isPositive: true }}
      />
      <MetricCard
        title={t('newCustomers')}
        value={metrics.newCustomers.toString()}
        icon={Users}
        trend={{ value: 22.5, isPositive: true }}
      />
    </div>
  )
}