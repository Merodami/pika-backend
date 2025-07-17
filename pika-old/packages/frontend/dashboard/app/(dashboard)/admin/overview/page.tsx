'use client'

// Force dynamic rendering to avoid SSR issues during build
export const dynamic = 'force-dynamic'

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ScanOutlined,
  ShopOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Spin, Statistic, Table } from 'antd'

import { adminAdapter } from '@/lib/api/admin-adapter'

interface AdminMetrics {
  totalUsers: number
  totalProviders: number
  totalVouchers: number
  totalRedemptions: number
  growth: {
    users: number
    providers: number
    vouchers: number
    redemptions: number
  }
}

interface RecentProvider {
  id: string
  name: string
  email: string
  status: 'pending' | 'verified' | 'suspended'
  createdAt: string
}

export default function AdminOverviewPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async (): Promise<AdminMetrics> => {
      const response = await adminAdapter.getPlatformAnalytics()

      return response.data
    },
  })

  const { data: recentProviders, isLoading: providersLoading } = useQuery({
    queryKey: ['admin', 'recent-providers'],
    queryFn: async (): Promise<RecentProvider[]> => {
      const response = await adminAdapter.getProviders({ page: 1 })

      return response.data.items
    },
  })

  const providerColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          verified: 'green',
          suspended: 'red',
        }

        return (
          <span
            className={`px-2 py-1 rounded text-xs bg-${colors[status as keyof typeof colors]}-100 text-${colors[status as keyof typeof colors]}-800`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ]

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600">
          Monitor your platform&apos;s performance and user activity.
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={metrics?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                metrics?.growth.users !== undefined ? (
                  <span
                    className={`text-sm ${metrics.growth.users >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {metrics.growth.users >= 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}
                    {Math.abs(metrics.growth.users)}%
                  </span>
                ) : undefined
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Service Providers"
              value={metrics?.totalProviders || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                metrics?.growth.providers !== undefined ? (
                  <span
                    className={`text-sm ${metrics.growth.providers >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {metrics.growth.providers >= 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}
                    {Math.abs(metrics.growth.providers)}%
                  </span>
                ) : undefined
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Vouchers"
              value={metrics?.totalVouchers || 0}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
              title="Total Redemptions"
              value={metrics?.totalRedemptions || 0}
              prefix={<ScanOutlined />}
              valueStyle={{ color: '#fa8c16' }}
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
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Service Providers" loading={providersLoading}>
            <Table
              dataSource={recentProviders}
              columns={providerColumns}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Review Pending Providers</div>
                <div className="text-sm text-gray-500">
                  Verify new service provider applications
                </div>
              </button>

              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Platform Analytics</div>
                <div className="text-sm text-gray-500">
                  View detailed platform metrics
                </div>
              </button>

              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">User Management</div>
                <div className="text-sm text-gray-500">
                  Manage user accounts and permissions
                </div>
              </button>

              <button className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">System Settings</div>
                <div className="text-sm text-gray-500">
                  Configure platform settings
                </div>
              </button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
