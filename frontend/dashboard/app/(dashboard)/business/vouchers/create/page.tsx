'use client'

// Force dynamic rendering to avoid SSR issues during build
export const dynamic = 'force-dynamic'

import { EyeOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Col, Row, Typography, message } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { VoucherDesignForm } from '@/components/features/voucher/voucherDesignForm'
import { VoucherPreview } from '@/components/features/voucher/voucherPreview'
import { VoucherTemplate } from '@/components/features/voucher/voucherTemplate'
import { useCreateVoucher } from '@/hooks/api'
import type { CreateVoucherRequest } from '@/lib/api/generated'

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

// Mapper function to convert VoucherDesign to CreateVoucherRequest
const mapVoucherDesignToCreateRequest = (
  design: VoucherDesign,
  businessId: string,
  categoryId: string
): CreateVoucherRequest => ({
  businessId,
  categoryId,
  // Convert single language to translations object (defaulting to English)
  title: { en: design.title },
  description: { en: design.description },
  termsAndConditions: {
    en: design.terms.length > 0 ? `${design.terms.join('. ')}.` : '',
  },
  discountType: design.discountType === 'fixed_amount' ? 'fixed' : 'percentage',
  discountValue: design.discountValue,
  currency: 'USD', // Default currency
  validFrom: design.validFrom,
  expiresAt: design.validUntil,
  maxRedemptions: design.maxRedemptions || null,
  maxRedemptionsPerUser: design.maxRedemptionsPerUser,
  imageUrl: design.bannerImageUrl || null,
  location: design.coordinates
    ? {
        type: 'Point',
        coordinates: [design.coordinates.lng, design.coordinates.lat],
      }
    : null,
  metadata: {
    template: design.template,
    primaryColor: design.primaryColor,
    backgroundColor: design.backgroundColor,
    textColor: design.textColor,
    businessName: design.businessName,
    businessAddress: design.businessAddress,
    businessPhone: design.businessPhone,
    businessWebsite: design.businessWebsite,
    minimumPurchase: design.minimumPurchase,
  },
})

export default function CreateVoucherPage() {
  const router = useRouter()
  const [voucherDesign, setVoucherDesign] =
    useState<VoucherDesign>(defaultVoucherDesign)
  const [selectedTemplate, setSelectedTemplate] =
    useState<VoucherDesign['template']>('modern')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  // Create voucher mutation
  const createVoucherMutation = useCreateVoucher()

  // Save draft mutation (using create voucher with draft status)
  const saveDraftMutation = useCreateVoucher()

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
    // TODO: Get actual businessId from user profile or context
    // TODO: Get actual categoryId by mapping category name to ID
    const businessId = 'temp-business-id' // This should come from user context
    const categoryId = 'temp-category-id' // This should be mapped from category name

    try {
      const createRequest = mapVoucherDesignToCreateRequest(
        voucherDesign,
        businessId,
        categoryId
      )

      saveDraftMutation.mutate(createRequest, {
        onSuccess: () => {
          message.success('Draft saved successfully!')
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || 'Failed to save draft')
        },
      })
    } catch (error) {
      message.error('Invalid voucher data. Please check all required fields.')
    }
  }

  const handlePublish = () => {
    // TODO: Get actual businessId from user profile or context
    // TODO: Get actual categoryId by mapping category name to ID
    const businessId = 'temp-business-id' // This should come from user context
    const categoryId = 'temp-category-id' // This should be mapped from category name

    try {
      const createRequest = mapVoucherDesignToCreateRequest(
        voucherDesign,
        businessId,
        categoryId
      )

      createVoucherMutation.mutate(createRequest, {
        onSuccess: () => {
          message.success('Voucher created successfully!')
          router.push('/business/vouchers')
        },
        onError: (error: any) => {
          message.error(
            error.response?.data?.message || 'Failed to create voucher'
          )
        },
      })
    } catch (error) {
      message.error('Invalid voucher data. Please check all required fields.')
    }
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
