'use client'

import { Empty, List, Spin, Tag, Typography } from 'antd'
import { formatDistanceToNow } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import {
  realtimeVoucherService,
  VoucherUpdate,
} from '@/services/firebase/realtime-vouchers'
import { useAuthStore } from '@/store/auth.store'

const { Text } = Typography

const getActivityColor = (type: VoucherUpdate['type']) => {
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

const getActivityIcon = (type: VoucherUpdate['type']) => {
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
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<VoucherUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.providerId) return

    setLoading(true)

    // Subscribe to real-time updates
    const unsubscribe = realtimeVoucherService.subscribeToUpdates(
      user.providerId,
      (updates) => {
        setActivities(updates)
        setLoading(false)
      },
      limit
    )

    return () => {
      unsubscribe()
    }
  }, [user?.providerId, limit])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Spin size="large" />
      </div>
    )
  }

  if (activities.length === 0) {
    return <Empty description="No voucher activity yet" className="py-8" />
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={activities}
      renderItem={(item) => {
        const timestamp =
          item.timestamp instanceof Timestamp
            ? item.timestamp.toDate()
            : new Date()

        return (
          <List.Item>
            <List.Item.Meta
              avatar={
                <div className="text-2xl">{getActivityIcon(item.type)}</div>
              }
              title={
                <div className="flex items-center gap-2">
                  <Text strong>Voucher #{item.voucherId.slice(-6)}</Text>
                  <Tag color={getActivityColor(item.type)}>
                    {item.type.toUpperCase()}
                  </Tag>
                </div>
              }
              description={
                <div className="space-y-1">
                  {item.metadata?.customerName && (
                    <Text type="secondary" className="block">
                      Customer: {item.metadata.customerName}
                    </Text>
                  )}
                  <Text type="secondary" className="text-xs">
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )
      }}
    />
  )
}
