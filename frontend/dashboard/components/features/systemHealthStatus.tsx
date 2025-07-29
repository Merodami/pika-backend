import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import type { LocaleProps } from '@/types/common'

type SystemHealthStatusProps = LocaleProps

export async function SystemHealthStatus({ locale }: SystemHealthStatusProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard.system' })

  // Mock system health data
  const services = [
    { name: 'API Gateway', status: 'operational', uptime: 99.9 },
    { name: 'Database', status: 'operational', uptime: 99.8 },
    { name: 'Redis Cache', status: 'operational', uptime: 100 },
    { name: 'Storage Service', status: 'degraded', uptime: 95.2 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('systemHealth')}
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {service.status === 'operational' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {service.status === 'degraded' && (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              {service.status === 'down' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {service.name}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              {service.uptime}% {t('uptime')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
