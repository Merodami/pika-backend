'use client'

// Force dynamic rendering to avoid SSR issues during build
export const dynamic = 'force-dynamic'

import { EyeOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Col, message, Row, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { VoucherDesignForm } from '@/components/features/voucher/voucher-design-form'
import { VoucherPreview } from '@/components/features/voucher/voucher-preview'
import { VoucherTemplate } from '@/components/features/voucher/voucher-template'
import { voucherAdapter } from '@/lib/api/voucher-adapter'

const { Title, Text } = Typography

export interface VoucherDesign {
  // Basic Information
  title: string
  description: string
  category: string

  // Discount Details
  discountType: 'percentage' | 'fixed_amount' | 'buy_one_get_one'
  discountValue: number
  originalPrice?: number
  finalPrice?: number

  // Validity & Limits
  validFrom: string
  validUntil: string
  maxRedemptions?: number
  maxRedemptionsPerUser?: number

  // Business Information
  businessName: string
  businessAddress: string
  businessPhone?: string
  businessWebsite?: string

  // Visual Design
  template: 'modern' | 'classic' | 'minimal' | 'bold'
  primaryColor: string
  backgroundColor: string
  textColor: string
  logoUrl?: string
  bannerImageUrl?: string

  // Terms & Conditions
  terms: string[]
  minimumPurchase?: number
  applicableProducts?: string[]
  excludedProducts?: string[]

  // Location Restrictions
  validLocations?: string[]
  coordinates?: {
    lat: number
    lng: number
  }

  // Status
  status: 'draft' | 'active' | 'paused' | 'expired'
}

const defaultVoucherDesign: VoucherDesign = {
  title: '',
  description: '',
  category: '',
  discountType: 'percentage',
  discountValue: 10,
  validFrom: '',
  validUntil: '',
  businessName: '',
  businessAddress: '',
  template: 'modern',
  primaryColor: '#1890ff',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  terms: [],
  status: 'draft',
}

export default function CreateVoucherPage() {
  const router = useRouter()
  const [voucherDesign, setVoucherDesign] =
    useState<VoucherDesign>(defaultVoucherDesign)
  const [selectedTemplate, setSelectedTemplate] =
    useState<VoucherDesign['template']>('modern')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  // Create voucher mutation
  const createVoucherMutation = useMutation({
    mutationFn: async (voucher: VoucherDesign) => {
      const response = await voucherAdapter.create(voucher)

      return response.data
    },
    onSuccess: () => {
      message.success('Voucher created successfully!')
      router.push('/business/vouchers')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create voucher')
    },
  })

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (voucher: VoucherDesign) => {
      const response = await voucherAdapter.saveDraft(voucher)

      return response.data
    },
    onSuccess: () => {
      message.success('Draft saved successfully!')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to save draft')
    },
  })

  const handleVoucherChange = (field: keyof VoucherDesign, value: any) => {
    setVoucherDesign((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTemplateSelect = (template: VoucherDesign['template']) => {
    setSelectedTemplate(template)
    setVoucherDesign((prev) => ({
      ...prev,
      template,
    }))
  }

  const handleSaveDraft = () => {
    saveDraftMutation.mutate({
      ...voucherDesign,
      status: 'draft',
    })
  }

  const handlePublish = () => {
    createVoucherMutation.mutate({
      ...voucherDesign,
      status: 'active',
    })
  }

  const isFormValid = () =>
    voucherDesign.title.trim() !== '' &&
    voucherDesign.description.trim() !== '' &&
    voucherDesign.category.trim() !== '' &&
    voucherDesign.discountValue > 0 &&
    voucherDesign.validFrom !== '' &&
    voucherDesign.validUntil !== '' &&
    voucherDesign.businessName.trim() !== '' &&
    voucherDesign.businessAddress.trim() !== ''

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2}>Create New Voucher</Title>
        <Text type="secondary">
          Design and customize your promotional voucher. Fill in the details and
          see a live preview.
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            type={previewMode === 'edit' ? 'primary' : 'default'}
            onClick={() => setPreviewMode('edit')}
          >
            Edit
          </Button>
          <Button
            type={previewMode === 'preview' ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => setPreviewMode('preview')}
          >
            Preview
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            loading={saveDraftMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handlePublish}
            disabled={!isFormValid()}
            loading={createVoucherMutation.isPending}
          >
            Publish Voucher
          </Button>
        </div>
      </div>

      {previewMode === 'edit' ? (
        <Row gutter={[24, 24]}>
          {/* Template Selection */}
          <Col span={24}>
            <VoucherTemplate
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
            />
          </Col>

          {/* Form and Preview */}
          <Col xs={24} lg={12}>
            <VoucherDesignForm
              voucherDesign={voucherDesign}
              onChange={handleVoucherChange}
            />
          </Col>

          <Col xs={24} lg={12}>
            <div className="sticky top-6">
              <VoucherPreview
                voucherDesign={voucherDesign}
                showQRCode={false}
              />
            </div>
          </Col>
        </Row>
      ) : (
        <div className="flex justify-center">
          <div className="max-w-md">
            <VoucherPreview
              voucherDesign={voucherDesign}
              showQRCode={true}
              fullScreen={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
