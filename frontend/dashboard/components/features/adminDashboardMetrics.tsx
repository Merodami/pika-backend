import { getTranslations } from 'next-intl/server'
import { Users, Building2, Ticket, TrendingUp } from 'lucide-react'

import { api } from '@/lib/api/client'
import { MetricCard } from '@/components/ui/metricCard'

export async function AdminDashboardMetrics() {
  const t = await getTranslations('dashboard.metrics')

  // Fetch metrics from API
  // This would be real API calls in production
  const metrics = {
    totalUsers: 1234,
    totalBusinesses: 567,
    totalVouchers: 8901,
    monthlyGrowth: 12.5,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title={t('totalUsers')}
        value={metrics.totalUsers.toLocaleString()}
        icon={Users}
        trend={{ value: 8.2, isPositive: true }}
      />
      <MetricCard
        title={t('totalBusinesses')}
        value={metrics.totalBusinesses.toLocaleString()}
        icon={Building2}
        trend={{ value: 3.4, isPositive: true }}
      />
      <MetricCard
        title={t('totalVouchers')}
        value={metrics.totalVouchers.toLocaleString()}
        icon={Ticket}
        trend={{ value: 15.7, isPositive: true }}
      />
      <MetricCard
        title={t('monthlyGrowth')}
        value={`${metrics.monthlyGrowth}%`}
        icon={TrendingUp}
        trend={{ value: 2.1, isPositive: true }}
      />
    </div>
  )
}