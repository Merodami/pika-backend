'use client'

import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Upload,
} from 'antd'
import { Color } from 'antd/es/color-picker'
import dayjs from 'dayjs'
import { useState } from 'react'

import type { VoucherDesign } from '@/app/(dashboard)/provider/vouchers/create/page'

const { TextArea } = Input
const { Option } = Select

interface VoucherDesignFormProps {
  voucherDesign: VoucherDesign
  onChange: (field: keyof VoucherDesign, value: any) => void
}

const categories = [
  'Food & Dining',
  'Retail & Shopping',
  'Health & Beauty',
  'Entertainment',
  'Travel & Tourism',
  'Automotive',
  'Services',
  'Technology',
  'Sports & Fitness',
  'Home & Garden',
]

export function VoucherDesignForm({
  voucherDesign,
  onChange,
}: VoucherDesignFormProps) {
  const [newTerm, setNewTerm] = useState('')

  const handleColorChange = (field: keyof VoucherDesign, color: Color) => {
    onChange(field, color.toHexString())
  }

  const addTerm = () => {
    if (newTerm.trim()) {
      onChange('terms', [...voucherDesign.terms, newTerm.trim()])
      setNewTerm('')
    }
  }

  const removeTerm = (index: number) => {
    const newTerms = voucherDesign.terms.filter((_, i) => i !== index)

    onChange('terms', newTerms)
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card title="Basic Information" size="small">
        <Form layout="vertical">
          <Form.Item
            label="Voucher Title"
            required
            tooltip="The main headline of your voucher"
          >
            <Input
              placeholder="e.g., 20% Off All Items"
              value={voucherDesign.title}
              onChange={(e) => onChange('title', e.target.value)}
              maxLength={60}
              showCount
            />
          </Form.Item>

          <Form.Item label="Description" required>
            <TextArea
              placeholder="Describe what customers get with this voucher..."
              value={voucherDesign.description}
              onChange={(e) => onChange('description', e.target.value)}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category" required>
                <Select
                  placeholder="Select category"
                  value={voucherDesign.category}
                  onChange={(value) => onChange('category', value)}
                  showSearch
                >
                  {categories.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Discount Details */}
      <Card title="Discount Details" size="small">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Discount Type" required>
                <Select
                  value={voucherDesign.discountType}
                  onChange={(value) => onChange('discountType', value)}
                >
                  <Option value="percentage">Percentage Off</Option>
                  <Option value="fixed_amount">Fixed Amount Off</Option>
                  <Option value="buy_one_get_one">Buy One Get One</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  voucherDesign.discountType === 'percentage'
                    ? 'Percentage (%)'
                    : 'Amount ($)'
                }
                required
              >
                <InputNumber
                  min={0}
                  max={
                    voucherDesign.discountType === 'percentage' ? 100 : 10000
                  }
                  value={voucherDesign.discountValue}
                  onChange={(value) => onChange('discountValue', value || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {voucherDesign.discountType !== 'buy_one_get_one' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Original Price ($)"
                  tooltip="Optional: Show original price for comparison"
                >
                  <InputNumber
                    min={0}
                    value={voucherDesign.originalPrice}
                    onChange={(value) => onChange('originalPrice', value)}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Minimum Purchase ($)"
                  tooltip="Minimum amount required to use this voucher"
                >
                  <InputNumber
                    min={0}
                    value={voucherDesign.minimumPurchase}
                    onChange={(value) => onChange('minimumPurchase', value)}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* Validity & Limits */}
      <Card title="Validity & Usage Limits" size="small">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Valid From" required>
                <DatePicker
                  style={{ width: '100%' }}
                  value={
                    voucherDesign.validFrom
                      ? dayjs(voucherDesign.validFrom)
                      : undefined
                  }
                  onChange={(date) =>
                    onChange('validFrom', date?.toISOString() || '')
                  }
                  disabledDate={(current) =>
                    current && current < dayjs().startOf('day')
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Valid Until" required>
                <DatePicker
                  style={{ width: '100%' }}
                  value={
                    voucherDesign.validUntil
                      ? dayjs(voucherDesign.validUntil)
                      : undefined
                  }
                  onChange={(date) =>
                    onChange('validUntil', date?.toISOString() || '')
                  }
                  disabledDate={(current) =>
                    current &&
                    current < dayjs(voucherDesign.validFrom || undefined)
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Max Total Redemptions"
                tooltip="Maximum number of times this voucher can be used by all customers"
              >
                <InputNumber
                  min={1}
                  value={voucherDesign.maxRedemptions}
                  onChange={(value) => onChange('maxRedemptions', value)}
                  style={{ width: '100%' }}
                  placeholder="Unlimited"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Max per Customer"
                tooltip="Maximum times one customer can use this voucher"
              >
                <InputNumber
                  min={1}
                  max={voucherDesign.maxRedemptions || 100}
                  value={voucherDesign.maxRedemptionsPerUser}
                  onChange={(value) => onChange('maxRedemptionsPerUser', value)}
                  style={{ width: '100%' }}
                  placeholder="Unlimited"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Business Information */}
      <Card title="Business Information" size="small">
        <Form layout="vertical">
          <Form.Item label="Business Name" required>
            <Input
              placeholder="Your business name"
              value={voucherDesign.businessName}
              onChange={(e) => onChange('businessName', e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Business Address" required>
            <TextArea
              placeholder="Your business address"
              value={voucherDesign.businessAddress}
              onChange={(e) => onChange('businessAddress', e.target.value)}
              rows={2}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phone Number">
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={voucherDesign.businessPhone}
                  onChange={(e) => onChange('businessPhone', e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Website">
                <Input
                  placeholder="https://yourbusiness.com"
                  value={voucherDesign.businessWebsite}
                  onChange={(e) => onChange('businessWebsite', e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Visual Design */}
      <Card title="Visual Design" size="small">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Primary Color">
                <ColorPicker
                  value={voucherDesign.primaryColor}
                  onChange={(color) => handleColorChange('primaryColor', color)}
                  showText
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Background Color">
                <ColorPicker
                  value={voucherDesign.backgroundColor}
                  onChange={(color) =>
                    handleColorChange('backgroundColor', color)
                  }
                  showText
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Text Color">
                <ColorPicker
                  value={voucherDesign.textColor}
                  onChange={(color) => handleColorChange('textColor', color)}
                  showText
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Logo Upload"
                tooltip="Upload your business logo (optional)"
              >
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  onChange={(info) => {
                    // Handle file upload logic here
                    // TODO: Implement file upload functionality
                    console.warn('Logo upload not implemented:', info)
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Logo</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Banner Image"
                tooltip="Upload a banner image (optional)"
              >
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  onChange={(info) => {
                    // Handle file upload logic here
                    console.log('Banner upload:', info)
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Banner</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Terms & Conditions */}
      <Card title="Terms & Conditions" size="small">
        <Form layout="vertical">
          <Form.Item
            label="Add Terms"
            tooltip="Add specific terms and conditions for this voucher"
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Enter a term or condition..."
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onPressEnter={addTerm}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={addTerm}>
                Add
              </Button>
            </Space.Compact>
          </Form.Item>

          {voucherDesign.terms.length > 0 && (
            <div className="space-y-2">
              {voucherDesign.terms.map((term, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => removeTerm(index)}
                  style={{ marginBottom: 8, padding: '4px 8px' }}
                >
                  {term}
                </Tag>
              ))}
            </div>
          )}
        </Form>
      </Card>
    </div>
  )
}
