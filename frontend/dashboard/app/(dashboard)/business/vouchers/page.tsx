'use client'

// Force dynamic rendering to avoid SSR issues during build
export const dynamic = 'force-dynamic'

import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  VoucherState,
  VoucherDiscountType,
  type VoucherStateType,
} from '@pika/types'
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  useVouchers,
  useDeleteVoucher,
  usePrefetchVoucher,
  useBulkUpdateVouchers,
} from '@/hooks/api'
import type { AdminVoucherQueryParams } from '@/lib/api/generated'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

// Use the SDK type
type Voucher = NonNullable<ReturnType<typeof useVouchers>['data']>['data'][0]

export default function VouchersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Build filters object
  const filters: AdminVoucherQueryParams = {
    page,
    limit: pageSize,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && {
      state: statusFilter as VoucherStateType,
    }),
    ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
  }

  // Use our custom hooks
  const { data: vouchersResponse, isLoading } = useVouchers(filters)
  const deleteVoucher = useDeleteVoucher()
  const bulkUpdateVouchers = useBulkUpdateVouchers()
  const prefetchVoucher = usePrefetchVoucher()

  // Extract data from response
  const vouchersData = vouchersResponse?.data
  const pagination = vouchersResponse?.pagination

  const handleDelete = (id: string, title: string) => {
    Modal.confirm({
      title: 'Delete Voucher',
      content: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteVoucher.mutate(id),
    })
  }

  const handleStatusUpdate = (id: string, state: 'published' | 'suspended') => {
    const action = state === 'published' ? 'publish' : 'suspend'

    Modal.confirm({
      title: `${action === 'publish' ? 'Publish' : 'Suspend'} Voucher`,
      content: `Are you sure you want to ${action} this voucher?`,
      okText: action === 'publish' ? 'Publish' : 'Suspend',
      okType: action === 'publish' ? 'primary' : 'default',
      cancelText: 'Cancel',
      onOk: () => {
        bulkUpdateVouchers.mutate({
          voucherIds: [id],
          updates: { state },
          reason: `Voucher ${action}ed by business owner`,
        })
      },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case VoucherState.published:
        return 'green'
      case VoucherState.suspended:
        return 'orange'
      case VoucherState.draft:
        return 'blue'
      case VoucherState.expired:
        return 'red'
      case VoucherState.claimed:
        return 'purple'
      case VoucherState.redeemed:
        return 'cyan'
      default:
        return 'default'
    }
  }

  const getDiscountDisplay = (voucher: Voucher) => {
    switch (voucher.discountType) {
      case VoucherDiscountType.percentage:
        return `${voucher.discountValue}% OFF`
      case VoucherDiscountType.fixed:
        return `$${voucher.discountValue} OFF`
      default:
        return 'OFFER'
    }
  }

  const getActionMenuItems = (voucher: Voucher) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => router.push(`/business/vouchers/${voucher.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => router.push(`/business/vouchers/${voucher.id}/edit`),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => router.push(`/business/vouchers/${voucher.id}/analytics`),
    },
    ...(voucher.state === VoucherState.published
      ? [
          {
            key: 'suspend',
            icon: <PauseCircleOutlined />,
            label: 'Suspend',
            onClick: () => handleStatusUpdate(voucher.id, 'suspended'),
          },
        ]
      : []),
    ...(voucher.state === VoucherState.draft
      ? [
          {
            key: 'publish',
            icon: <PlayCircleOutlined />,
            label: 'Publish',
            onClick: () => handleStatusUpdate(voucher.id, 'published'),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleDelete(voucher.id, voucher.title),
    },
  ]

  const columns = [
    {
      title: 'Voucher',
      key: 'voucher',
      render: (voucher: Voucher) => (
        <div>
          <div className="font-medium text-gray-900">{voucher.title}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {voucher.description}
          </div>
          <Tag color="blue" className="mt-1">
            {voucher.category?.name || 'No Category'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (voucher: Voucher) => (
        <Tag color="green" className="font-medium">
          {getDiscountDisplay(voucher)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (voucher: Voucher) => (
        <Tag color={getStatusColor(voucher.state)}>
          {voucher.state.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (voucher: Voucher) => (
        <div className="text-sm">
          <div>{format(new Date(voucher.validFrom), 'MMM dd, yyyy')}</div>
          <div className="text-gray-500">
            to {format(new Date(voucher.expiresAt), 'MMM dd, yyyy')}
          </div>
        </div>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (voucher: Voucher) => (
        <div className="text-sm">
          <div className="font-medium">{voucher.currentRedemptions || 0}</div>
          <div className="text-gray-500">
            {voucher.maxRedemptions ? `/ ${voucher.maxRedemptions}` : '/ ∞'}
          </div>
        </div>
      ),
    },
    {
      title: 'Created',
      key: 'created',
      render: (voucher: Voucher) => (
        <div className="text-sm text-gray-500">
          {format(new Date(voucher.createdAt), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (voucher: Voucher) => (
        <Dropdown
          menu={{ items: getActionMenuItems(voucher) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const vouchers = vouchersData || []
  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.state === VoucherState.published).length,
    draft: vouchers.filter((v) => v.state === VoucherState.draft).length,
    paused: vouchers.filter((v) => v.state === VoucherState.suspended).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>Vouchers</Title>
          <Text type="secondary">
            Create and manage your promotional vouchers
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push('/business/vouchers/create')}
        >
          Create Voucher
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Vouchers" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Drafts"
              value={stats.draft}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Paused"
              value={stats.paused}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search vouchers..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={(value) => setSearchTerm(value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="published">Published</Option>
              <Option value="draft">Draft</Option>
              <Option value="claimed">Claimed</Option>
              <Option value="redeemed">Redeemed</Option>
              <Option value="expired">Expired</Option>
              <Option value="suspended">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              placeholder="Category"
            >
              <Option value="all">All Categories</Option>
              <Option value="Food & Dining">Food & Dining</Option>
              <Option value="Retail & Shopping">Retail & Shopping</Option>
              <Option value="Health & Beauty">Health & Beauty</Option>
              <Option value="Entertainment">Entertainment</Option>
              <Option value="Travel & Tourism">Travel & Tourism</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={vouchers}
          rowKey="id"
          loading={isLoading}
          onRow={(record) => ({
            onMouseEnter: () => prefetchVoucher(record.id),
          })}
          pagination={{
            current: page,
            pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (totalCount, range) =>
              `${range[0]}-${range[1]} of ${totalCount} vouchers`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize)
              }
            },
          }}
        />
      </Card>
    </div>
  )
}
