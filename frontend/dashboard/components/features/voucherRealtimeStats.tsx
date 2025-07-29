'use client'

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  ScanOutlined,
  TagOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'

// Temporary placeholder data
const mockStats = {
  activeSessions: 42,
  activeSessions24h: 156,
  activeScans: 8,
  activeScans24h: 89,
  uniqueCustomers: 234,
  uniqueCustomers24h: 567,
  activeVouchers: 18,
  activeVouchers24h: 45,
}

export function VoucherRealtimeStats() {
  // TODO: Replace with real API data when available

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Sessions"
            value={mockStats.activeSessions}
            prefix={<EyeOutlined />}
            valueStyle={{ color: '#3f8600' }}
            suffix={
              <span className="text-sm text-green-500">
                <ArrowUpOutlined />
                12%
              </span>
            }
          />
          <div className="text-xs text-gray-500 mt-2">
            {mockStats.activeSessions24h} in last 24h
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Scans"
            value={mockStats.activeScans}
            prefix={<ScanOutlined />}
            valueStyle={{ color: '#1890ff' }}
            suffix={
              <span className="text-sm text-green-500">
                <ArrowUpOutlined />
                8%
              </span>
            }
          />
          <div className="text-xs text-gray-500 mt-2">
            {mockStats.activeScans24h} in last 24h
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Unique Customers"
            value={mockStats.uniqueCustomers}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#722ed1' }}
            suffix={
              <span className="text-sm text-red-500">
                <ArrowDownOutlined />
                3%
              </span>
            }
          />
          <div className="text-xs text-gray-500 mt-2">
            {mockStats.uniqueCustomers24h} total registered
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Vouchers"
            value={mockStats.activeVouchers}
            prefix={<TagOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
          <div className="text-xs text-gray-500 mt-2">
            {mockStats.activeVouchers24h} total created
          </div>
        </Card>
      </Col>
    </Row>
  )
}
