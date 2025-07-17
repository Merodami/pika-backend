'use client'

// Force dynamic rendering to avoid SSR issues during build
export const dynamic = 'force-dynamic'

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  ScanOutlined,
  TagOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd'

import { VoucherActivityFeed } from '@/components/features/voucher-activity-feed'
import { VoucherRealtimeStats } from '@/components/features/voucher-realtime-stats'
import { providerAdapter } from '@/lib/api/provider-adapter'

const { Title, Text } = Typography

interface DashboardMetrics {
  totalVouchers: number
  activeVouchers: number
  totalRedemptions: number
  totalRevenue: number
  conversionRate: number
  growth: {
    vouchers: number
    redemptions: number
    revenue: number
  }
}

export default function ProviderDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['provider', 'dashboard'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await providerAdapter.getAnalytics()

      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">
          Welcome back! Here&apos;s your business overview.
        </Text>
      </div>

      {/* Real-time stats from Firebase */}
      <div className="mb-4">
        <Title level={4} className="mb-3">
          Real-time Statistics
        </Title>
        <VoucherRealtimeStats />
      </div>

      {/* API-based metrics */}
      <div className="mb-4">
        <Title level={4} className="mb-3">
          Historical Overview
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Vouchers"
                value={metrics?.totalVouchers || 0}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix={
                  metrics?.growth.vouchers !== undefined ? (
                    <span
                      className={`text-sm ${metrics.growth.vouchers >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {metrics.growth.vouchers >= 0 ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )}
                      {Math.abs(metrics.growth.vouchers)}%
                    </span>
                  ) : undefined
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Vouchers"
                value={metrics?.activeVouchers || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Redemptions"
                value={metrics?.totalRedemptions || 0}
                prefix={<ScanOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix={
                  metrics?.growth.redemptions !== undefined ? (
                    <span
                      className={`text-sm ${metrics.growth.redemptions >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {metrics.growth.redemptions >= 0 ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )}
                      {Math.abs(metrics.growth.redemptions)}%
                    </span>
                  ) : undefined
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={metrics?.totalRevenue || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#fa8c16' }}
                suffix={
                  metrics?.growth.revenue !== undefined ? (
                    <span
                      className={`text-sm ${metrics.growth.revenue >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {metrics.growth.revenue >= 0 ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )}
                      {Math.abs(metrics.growth.revenue)}%
                    </span>
                  ) : undefined
                }
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Real-time Activity Feed"
            extra={
              <Text type="secondary" className="text-xs">
                Live updates from Firebase
              </Text>
            }
          >
            <VoucherActivityFeed limit={15} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Create New Voucher</div>
                <div className="text-sm text-gray-500">
                  Start a new promotional campaign
                </div>
              </button>

              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-gray-500">
                  Check your performance metrics
                </div>
              </button>

              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Scan QR Code</div>
                <div className="text-sm text-gray-500">
                  Redeem a customer voucher
                </div>
              </button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
