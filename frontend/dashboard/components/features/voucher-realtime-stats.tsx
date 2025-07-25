'use client'

import {
  CheckCircleOutlined,
  PercentageOutlined,
  ShoppingOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Spin, Statistic } from 'antd'
import { useEffect, useState } from 'react'

import {
  realtimeVoucherService,
  VoucherStats,
} from '@/services/firebase/realtime-vouchers'
import { useAuthStore } from '@/store/auth.store'

export function VoucherRealtimeStats() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<VoucherStats>({
    totalVouchers: 0,
    activeVouchers: 0,
    claimedToday: 0,
    redeemedToday: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.businessId) return

    setLoading(true)

    // Subscribe to real-time stats
    const unsubscribe = realtimeVoucherService.subscribeToStats(
      user.businessId,
      (newStats) => {
        setStats(newStats)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user?.businessId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Total Vouchers"
            value={stats.totalVouchers}
            prefix={<TagsOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Active Vouchers"
            value={stats.activeVouchers}
            prefix={<ShoppingOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Claimed Today"
            value={stats.claimedToday}
            prefix={<CheckCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Conversion Rate"
            value={stats.conversionRate}
            precision={2}
            suffix="%"
            prefix={<PercentageOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
