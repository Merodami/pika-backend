'use client'

import {
  CalendarOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  PhoneOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { Card, Divider, QRCode, Space, Tag, Typography } from 'antd'
import { format } from 'date-fns'

import type { VoucherDesign } from '@/app/(dashboard)/business/vouchers/create/page'

const { Title, Text, Paragraph } = Typography

interface VoucherPreviewProps {
  voucherDesign: VoucherDesign
  showQRCode?: boolean
  fullScreen?: boolean
}

export function VoucherPreview({
  voucherDesign,
  showQRCode = false,
  fullScreen = false,
}: VoucherPreviewProps) {
  const getDiscountDisplay = () => {
    switch (voucherDesign.discountType) {
      case 'percentage':
        return `${voucherDesign.discountValue}% OFF`
      case 'fixed_amount':
        return `$${voucherDesign.discountValue} OFF`
      case 'buy_one_get_one':
        return 'BUY 1 GET 1'
      default:
        return 'SPECIAL OFFER'
    }
  }

  const getTemplateStyles = () => {
    const baseStyles = {
      backgroundColor: voucherDesign.backgroundColor,
      color: voucherDesign.textColor,
      border: `2px solid ${voucherDesign.primaryColor}`,
    }

    switch (voucherDesign.template) {
      case 'modern':
        return {
          ...baseStyles,
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${voucherDesign.backgroundColor} 0%, ${voucherDesign.primaryColor}15 100%)`,
        }
      case 'classic':
        return {
          ...baseStyles,
          borderRadius: '8px',
          borderStyle: 'dashed',
        }
      case 'minimal':
        return {
          ...baseStyles,
          borderRadius: '4px',
          borderWidth: '1px',
        }
      case 'bold':
        return {
          ...baseStyles,
          borderRadius: '12px',
          borderWidth: '3px',
          background: `linear-gradient(45deg, ${voucherDesign.primaryColor}20 0%, ${voucherDesign.backgroundColor} 50%, ${voucherDesign.primaryColor}20 100%)`,
        }
      default:
        return baseStyles
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const cardStyle = getTemplateStyles()
  const containerClass = fullScreen ? 'w-full max-w-md mx-auto' : 'w-full'

  return (
    <div className={containerClass}>
      <Card
        style={cardStyle}
        className="voucher-preview shadow-lg"
        bodyStyle={{ padding: fullScreen ? '24px' : '16px' }}
      >
        {/* Header Section */}
        <div className="text-center mb-4">
          {/* Discount Badge */}
          <div
            className="inline-block px-6 py-3 mb-3 rounded-full text-white font-bold text-xl"
            style={{
              backgroundColor: voucherDesign.primaryColor,
              fontSize: fullScreen ? '24px' : '18px',
            }}
          >
            <PercentageOutlined className="mr-2" />
            {getDiscountDisplay()}
          </div>

          {/* Title */}
          <Title
            level={fullScreen ? 2 : 3}
            style={{
              color: voucherDesign.textColor,
              margin: '8px 0',
              fontSize: fullScreen ? '28px' : '20px',
            }}
          >
            {voucherDesign.title || 'Your Voucher Title'}
          </Title>

          {/* Description */}
          <Paragraph
            style={{
              color: voucherDesign.textColor,
              margin: '8px 0',
              fontSize: fullScreen ? '16px' : '14px',
            }}
          >
            {voucherDesign.description ||
              'Voucher description will appear here...'}
          </Paragraph>
        </div>

        {/* Validity Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm">
            <Space>
              <CalendarOutlined style={{ color: voucherDesign.primaryColor }} />
              <Text style={{ color: voucherDesign.textColor }}>
                Valid:{' '}
                {voucherDesign.validFrom
                  ? formatDate(voucherDesign.validFrom)
                  : 'Start Date'}{' '}
                -{' '}
                {voucherDesign.validUntil
                  ? formatDate(voucherDesign.validUntil)
                  : 'End Date'}
              </Text>
            </Space>
          </div>
        </div>

        <Divider style={{ borderColor: voucherDesign.primaryColor }} />

        {/* Business Information */}
        <div className="mb-4">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <ShopOutlined style={{ color: voucherDesign.primaryColor }} />
              <Text strong style={{ color: voucherDesign.textColor }}>
                {voucherDesign.businessName || 'Business Name'}
              </Text>
            </Space>

            <Text
              type="secondary"
              style={{
                color: voucherDesign.textColor,
                opacity: 0.8,
                fontSize: '12px',
              }}
            >
              {voucherDesign.businessAddress || 'Business Address'}
            </Text>

            {(voucherDesign.businessPhone || voucherDesign.businessWebsite) && (
              <Space split={<Divider type="vertical" />}>
                {voucherDesign.businessPhone && (
                  <Space size="small">
                    <PhoneOutlined
                      style={{ color: voucherDesign.primaryColor }}
                    />
                    <Text
                      style={{
                        color: voucherDesign.textColor,
                        fontSize: '12px',
                      }}
                    >
                      {voucherDesign.businessPhone}
                    </Text>
                  </Space>
                )}
                {voucherDesign.businessWebsite && (
                  <Space size="small">
                    <GlobalOutlined
                      style={{ color: voucherDesign.primaryColor }}
                    />
                    <Text
                      style={{
                        color: voucherDesign.textColor,
                        fontSize: '12px',
                      }}
                    >
                      Website
                    </Text>
                  </Space>
                )}
              </Space>
            )}
          </Space>
        </div>

        {/* Usage Limits */}
        {(voucherDesign.maxRedemptions ||
          voucherDesign.maxRedemptionsPerUser ||
          voucherDesign.minimumPurchase) && (
          <>
            <Divider style={{ borderColor: voucherDesign.primaryColor }} />
            <div className="mb-4">
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                {voucherDesign.minimumPurchase && (
                  <Text
                    style={{ color: voucherDesign.textColor, fontSize: '12px' }}
                  >
                    • Minimum purchase: ${voucherDesign.minimumPurchase}
                  </Text>
                )}
                {voucherDesign.maxRedemptionsPerUser && (
                  <Text
                    style={{ color: voucherDesign.textColor, fontSize: '12px' }}
                  >
                    • Limit {voucherDesign.maxRedemptionsPerUser} per customer
                  </Text>
                )}
                {voucherDesign.maxRedemptions && (
                  <Text
                    style={{ color: voucherDesign.textColor, fontSize: '12px' }}
                  >
                    • Limited to {voucherDesign.maxRedemptions} total uses
                  </Text>
                )}
              </Space>
            </div>
          </>
        )}

        {/* Terms & Conditions */}
        {voucherDesign.terms.length > 0 && (
          <>
            <Divider style={{ borderColor: voucherDesign.primaryColor }} />
            <div className="mb-4">
              <Space>
                <InfoCircleOutlined
                  style={{ color: voucherDesign.primaryColor }}
                />
                <Text
                  strong
                  style={{ color: voucherDesign.textColor, fontSize: '12px' }}
                >
                  Terms & Conditions:
                </Text>
              </Space>
              <ul className="mt-2 ml-4">
                {voucherDesign.terms.map((term, index) => (
                  <li key={index}>
                    <Text
                      style={{
                        color: voucherDesign.textColor,
                        fontSize: '11px',
                      }}
                    >
                      {term}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Category Tag */}
        {voucherDesign.category && (
          <div className="mb-4">
            <Tag color={voucherDesign.primaryColor}>
              {voucherDesign.category}
            </Tag>
          </div>
        )}

        {/* QR Code */}
        {showQRCode && (
          <>
            <Divider style={{ borderColor: voucherDesign.primaryColor }} />
            <div className="text-center">
              <QRCode
                value={`voucher-${Date.now()}`}
                size={fullScreen ? 120 : 80}
                style={{ margin: '16px 0' }}
              />
              <Text
                style={{
                  color: voucherDesign.textColor,
                  fontSize: '10px',
                  display: 'block',
                }}
              >
                Scan to redeem this voucher
              </Text>
            </div>
          </>
        )}

        {/* Footer */}
        <div
          className="text-center mt-4 pt-4"
          style={{ borderTop: `1px dashed ${voucherDesign.primaryColor}` }}
        >
          <Text
            style={{
              color: voucherDesign.textColor,
              fontSize: '10px',
              opacity: 0.7,
            }}
          >
            Powered by Pika • Not valid with other offers
          </Text>
        </div>
      </Card>
    </div>
  )
}
