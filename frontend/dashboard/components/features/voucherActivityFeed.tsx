'use client'

import { Empty, List, Tag, Typography } from 'antd'
import { formatDistanceToNow } from 'date-fns'

const { Text } = Typography

// Temporary placeholder data
const mockActivities = [
  {
    id: '1',
    type: 'created',
    voucherTitle: 'Summer Sale 20% Off',
    customerName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '2',
    type: 'redeemed',
    voucherTitle: 'Buy One Get One Free',
    customerName: 'Jane Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '3',
    type: 'claimed',
    voucherTitle: 'Welcome Discount',
    customerName: 'Bob Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
]

const getActivityColor = (type: string) => {
  switch (type) {
    case 'created':
      return 'blue'
    case 'updated':
      return 'cyan'
    case 'claimed':
      return 'orange'
    case 'redeemed':
      return 'green'
    case 'expired':
      return 'red'
    default:
      return 'default'
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'created':
      return '🎉'
    case 'updated':
      return '✏️'
    case 'claimed':
      return '🎟️'
    case 'redeemed':
      return '✅'
    case 'expired':
      return '⏰'
    default:
      return '📋'
  }
}

export function VoucherActivityFeed({ limit = 20 }: { limit?: number }) {
  // TODO: Replace with real API data when available
  const activities = mockActivities.slice(0, limit)

  if (activities.length === 0) {
    return <Empty description="No recent activity" />
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={activities}
      renderItem={(activity) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
            }
            title={
              <div className="flex items-center gap-2">
                <Tag color={getActivityColor(activity.type)}>
                  {activity.type.toUpperCase()}
                </Tag>
                <Text strong>{activity.voucherTitle}</Text>
              </div>
            }
            description={
              <div className="space-y-1">
                <Text type="secondary">
                  {activity.type === 'created' && 'New voucher created'}
                  {activity.type === 'redeemed' &&
                    `Redeemed by ${activity.customerName}`}
                  {activity.type === 'claimed' &&
                    `Claimed by ${activity.customerName}`}
                </Text>
                <Text type="secondary" className="text-xs">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )
}
