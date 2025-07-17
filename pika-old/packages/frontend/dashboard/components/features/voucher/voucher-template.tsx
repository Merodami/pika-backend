'use client'

import { CheckOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Typography } from 'antd'

import type { VoucherDesign } from '@/app/(dashboard)/provider/vouchers/create/page'

const { Title, Text } = Typography

interface VoucherTemplateProps {
  selectedTemplate: VoucherDesign['template']
  onTemplateSelect: (template: VoucherDesign['template']) => void
}

interface Template {
  id: VoucherDesign['template']
  name: string
  description: string
  preview: React.ReactNode
  features: string[]
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with gradient backgrounds',
    features: ['Gradient background', 'Rounded corners', 'Modern typography'],
    preview: (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-2xl p-4 h-32">
        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-2">
          20% OFF
        </div>
        <div className="text-blue-900 font-semibold text-sm">Modern Offer</div>
        <div className="text-blue-700 text-xs mt-1">
          Clean, professional look
        </div>
      </div>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional coupon style with dashed borders',
    features: ['Dashed borders', 'Traditional layout', 'Vintage feel'],
    preview: (
      <div className="bg-white border-2 border-dashed border-orange-500 rounded-lg p-4 h-32">
        <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-bold inline-block mb-2">
          $10 OFF
        </div>
        <div className="text-orange-900 font-semibold text-sm">
          Classic Coupon
        </div>
        <div className="text-orange-700 text-xs mt-1">Timeless design</div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean with minimal visual elements',
    features: ['Clean lines', 'Lots of whitespace', 'Simple typography'],
    preview: (
      <div className="bg-white border border-gray-300 rounded p-4 h-32">
        <div className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-bold inline-block mb-2">
          15% OFF
        </div>
        <div className="text-gray-900 font-semibold text-sm">
          Minimal Design
        </div>
        <div className="text-gray-600 text-xs mt-1">Less is more</div>
      </div>
    ),
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Eye-catching design with vibrant colors and strong elements',
    features: ['Vibrant colors', 'Strong typography', 'High contrast'],
    preview: (
      <div className="bg-gradient-to-r from-purple-200 via-white to-purple-200 border-4 border-purple-600 rounded-xl p-4 h-32">
        <div className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-bold inline-block mb-2">
          BUY 1 GET 1
        </div>
        <div className="text-purple-900 font-bold text-sm">Bold Statement</div>
        <div className="text-purple-700 text-xs mt-1">Stand out design</div>
      </div>
    ),
  },
]

export function VoucherTemplate({
  selectedTemplate,
  onTemplateSelect,
}: VoucherTemplateProps) {
  return (
    <Card title="Choose Template" size="small" className="mb-6">
      <Row gutter={[16, 16]}>
        {templates.map((template) => (
          <Col xs={24} sm={12} lg={6} key={template.id}>
            <Card
              hoverable
              className={`template-card ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
              bodyStyle={{ padding: '16px' }}
              onClick={() => onTemplateSelect(template.id)}
            >
              {/* Template Preview */}
              <div className="mb-3">{template.preview}</div>

              {/* Template Info */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Title level={5} className="mb-0 mr-2">
                    {template.name}
                  </Title>
                  {selectedTemplate === template.id && (
                    <CheckOutlined className="text-blue-500" />
                  )}
                </div>

                <Text type="secondary" className="text-xs block mb-3">
                  {template.description}
                </Text>

                {/* Features */}
                <div className="space-y-1">
                  {template.features.map((feature, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      • {feature}
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <Button
                  type={
                    selectedTemplate === template.id ? 'primary' : 'default'
                  }
                  size="small"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTemplateSelect(template.id)
                  }}
                >
                  {selectedTemplate === template.id ? 'Selected' : 'Select'}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <Text type="secondary" className="text-sm">
          💡 <strong>Tip:</strong> You can customize colors, fonts, and other
          design elements after selecting a template. Each template provides a
          different foundation for your voucher design.
        </Text>
      </div>
    </Card>
  )
}
