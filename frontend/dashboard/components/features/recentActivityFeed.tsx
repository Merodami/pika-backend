import { Clock, User, Ticket, Building2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import type { LocaleProps } from '@/types/common'

type RecentActivityFeedProps = LocaleProps

export async function RecentActivityFeed({ locale }: RecentActivityFeedProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  // Mock activity data - would come from API
  const activities = [
    {
      id: '1',
      type: 'user_registered',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      icon: User,
    },
    {
      id: '2',
      type: 'voucher_created',
      business: 'Pizza Palace',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      icon: Ticket,
    },
    {
      id: '3',
      type: 'business_verified',
      business: 'Fitness Center',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      icon: Building2,
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('recentActivity')}
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {activities.map((activity) => {
          const Icon = activity.icon

          return (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.type === 'user_registered' && (
                      <>
                        New user{' '}
                        <span className="font-medium">{activity.user}</span>{' '}
                        registered
                      </>
                    )}
                    {activity.type === 'voucher_created' && (
                      <>
                        New voucher created by{' '}
                        <span className="font-medium">{activity.business}</span>
                      </>
                    )}
                    {activity.type === 'business_verified' && (
                      <>
                        <span className="font-medium">{activity.business}</span>{' '}
                        was verified
                      </>
                    )}
                  </p>

                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          {t('viewAllActivity')}
        </button>
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
