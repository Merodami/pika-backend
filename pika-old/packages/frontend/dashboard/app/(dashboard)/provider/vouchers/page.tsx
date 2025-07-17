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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  message,
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

import { voucherAdapter } from '@/lib/api/voucher-adapter'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Voucher {
  id: string
  title: string
  description: string
  category: string
  discountType: 'percentage' | 'fixed_amount' | 'buy_one_get_one'
  discountValue: number
  status: 'draft' | 'active' | 'paused' | 'expired'
  validFrom: string
  validUntil: string
  maxRedemptions?: number
  currentRedemptions: number
  businessName: string
  createdAt: string
  updatedAt: string
}

export default function VouchersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch vouchers
  const { data: vouchersData, isLoading } = useQuery({
    queryKey: [
      'vouchers',
      page,
      pageSize,
      searchTerm,
      statusFilter,
      categoryFilter,
    ],
    queryFn: async () => {
      const params: any = {
        page,
        limit: pageSize,
      }

      if (searchTerm) params.search = searchTerm
      if (statusFilter !== 'all') params.status = statusFilter
      if (categoryFilter !== 'all') params.category = categoryFilter

      const response = await voucherAdapter.getAll(params)

      return response.data
    },
  })

  // Delete voucher mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => voucherAdapter.delete(id),
    onSuccess: () => {
      message.success('Voucher deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: () => {
      message.error('Failed to delete voucher')
    },
  })

  // Pause/Resume mutations
  const pauseMutation = useMutation({
    mutationFn: (id: string) => voucherAdapter.pause(id),
    onSuccess: () => {
      message.success('Voucher paused')
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: () => {
      message.error('Failed to pause voucher')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => voucherAdapter.resume(id),
    onSuccess: () => {
      message.success('Voucher resumed')
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: () => {
      message.error('Failed to resume voucher')
    },
  })

  const handleDelete = (id: string, title: string) => {
    Modal.confirm({
      title: 'Delete Voucher',
      content: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'paused':
        return 'orange'
      case 'draft':
        return 'blue'
      case 'expired':
        return 'red'
      default:
        return 'default'
    }
  }

  const getDiscountDisplay = (voucher: Voucher) => {
    switch (voucher.discountType) {
      case 'percentage':
        return `${voucher.discountValue}% OFF`
      case 'fixed_amount':
        return `$${voucher.discountValue} OFF`
      case 'buy_one_get_one':
        return 'BOGO'
      default:
        return 'OFFER'
    }
  }

  const getActionMenuItems = (voucher: Voucher) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => router.push(`/provider/vouchers/${voucher.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => router.push(`/provider/vouchers/${voucher.id}/edit`),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => router.push(`/provider/vouchers/${voucher.id}/analytics`),
    },
    ...(voucher.status === 'active'
      ? [
          {
            key: 'pause',
            icon: <PauseCircleOutlined />,
            label: 'Pause',
            onClick: () => pauseMutation.mutate(voucher.id),
          },
        ]
      : []),
    ...(voucher.status === 'paused'
      ? [
          {
            key: 'resume',
            icon: <PlayCircleOutlined />,
            label: 'Resume',
            onClick: () => resumeMutation.mutate(voucher.id),
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
            {voucher.category}
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
        <Tag color={getStatusColor(voucher.status)}>
          {voucher.status.toUpperCase()}
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
            to {format(new Date(voucher.validUntil), 'MMM dd, yyyy')}
          </div>
        </div>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (voucher: Voucher) => (
        <div className="text-sm">
          <div className="font-medium">{voucher.currentRedemptions}</div>
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

  const vouchers = vouchersData?.vouchers || []
  const total = vouchersData?.total || 0
  const stats = vouchersData?.stats || {
    total: 0,
    active: 0,
    draft: 0,
    paused: 0,
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
          onClick={() => router.push('/provider/vouchers/create')}
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
              <Option value="active">Active</Option>
              <Option value="draft">Draft</Option>
              <Option value="paused">Paused</Option>
              <Option value="expired">Expired</Option>
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
          pagination={{
            current: page,
            pageSize,
            total,
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
