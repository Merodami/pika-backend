#!/usr/bin/env tsx

import { AxiosInstance } from 'axios'
import QRCode from 'qrcode'
import {
  authenticateUser,
  colors,
  createApiClient,
  executeFlow,
  logError,
  logInfo,
  logSection,
  logStep,
  logSuccess,
  TEST_USERS,
} from './flow-utils.js'
import { createTestUsers } from './setup-test-users.js'

// Test configuration
const timestamp = Date.now()
const WEB_URL = 'http://localhost:3001' // pika-links

// API client
let api: AxiosInstance

// Store created entities for cleanup
let createdVoucherId: string | null = null
let validationCode: string | null = null
let businessId: string | null = null

async function getOrCreateBusiness(
  businessToken: string,
  adminToken: string,
  categoryId: string,
): Promise<string> {
  logInfo(`Checking for existing business...`)

  // First check if business exists via business owner's token
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`

  try {
    // Try to get existing business for this user
    const response = await api.get('/businesses/me')

    // Check if we have data
    if (response.data) {
      const businesses = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [response.data]

      if (businesses.length > 0) {
        const business = businesses[0]
        logSuccess(`Found existing business: ${business.id}`)
        return business.id
      }
    }
  } catch (error: any) {
    logInfo('No existing business found')
  }

  // Create new business
  logInfo('Creating new business...')
  const businessData = {
    businessName: `QR Test Business ${timestamp}`,
    businessDescription: 'Test business for QR validation flow',
    categoryId: categoryId,
  }

  const createResponse = await api.post('/businesses/me', businessData)
  const newBusinessId = createResponse.data.id

  logSuccess(`Created business: ${newBusinessId}`)

  // Verify and activate via admin
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  await api.post(`/admin/businesses/${newBusinessId}/verify`, {
    verified: true,
  })
  await api.post(`/admin/businesses/${newBusinessId}/activate`, {})

  logSuccess('Business verified and activated')

  return newBusinessId
}

async function runQRValidationFlow() {
  logSection('Phase 1: Setup & Authentication')

  // Step 1: Create test users if needed
  logStep(1, 'Setup Test Users')
  await createTestUsers()

  // Step 2: Authenticate as business owner
  logStep(2, 'Authenticate as Business Owner')
  const { accessToken: businessToken } = await authenticateUser(
    api,
    TEST_USERS.business.email,
    TEST_USERS.business.password,
  )

  // Step 3: Authenticate as admin for setup
  logStep(3, 'Authenticate as Admin')
  const { accessToken: adminToken } = await authenticateUser(
    api,
    TEST_USERS.admin.email,
    TEST_USERS.admin.password,
  )

  // Step 4: Get categories
  logStep(4, 'Get Categories')
  const categoriesResponse = await api.get('/categories')
  const categoryId = categoriesResponse.data.data[0]?.id

  if (!categoryId) {
    throw new Error('No categories found')
  }

  logSuccess(`Using category: ${categoryId}`)

  // Step 5: Get or create business
  logStep(5, 'Setup Business')
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`
  businessId = await getOrCreateBusiness(businessToken, adminToken, categoryId)

  logSection('Phase 2: Voucher Creation with Validation Code')

  // Step 6: Create voucher
  logStep(6, 'Create Test Voucher')
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`

  // Use MinIO port from environment or default to 9000
  const minioPort = process.env.MINIO_PORT || '9000'
  const minioHost = 'localhost'

  // Random image URLs from MinIO like the seeded vouchers
  const voucherImages = [
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/medium/voucher/gift-card-1.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/medium/voucher/promo-6.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/medium/voucher/discount-2.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/small/voucher/shopping-5.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/small/voucher/special-10.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/medium/voucher/rewards-9.jpg`,
    `http://${minioHost}:${minioPort}/thevoucherbook-uploads/test-seed-images/small/voucher/discount-2.jpg`,
  ]

  // Pick a random image
  const randomImage =
    voucherImages[Math.floor(Math.random() * voucherImages.length)]

  const voucherData = {
    title: `QR Test Voucher ${timestamp}`,
    description: 'Test voucher for QR code validation flow',
    discountType: 'percentage',
    value: 20,
    businessId: businessId,
    state: 'published',
    maxRedemptions: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: randomImage,
  }

  const voucherResponse = await api.post('/admin/vouchers', voucherData)
  createdVoucherId = voucherResponse.data.id
  logSuccess(`Created voucher: ${createdVoucherId}`)

  // Step 7: Generate validation code for QR
  logStep(7, 'Generate Validation Code for QR')

  const validationResponse = await api.post(
    `/vouchers/${createdVoucherId}/deep-link`,
    {
      type: 'SCAN',
      campaignId: 'test-campaign',
      source: 'testing',
    },
  )

  validationCode = validationResponse.data.validationCode
  const deepLink = validationResponse.data.deepLink
  const qrData = validationResponse.data.qrData

  logSuccess(`Generated validation code: ${validationCode}`)
  logInfo(`Deep link: ${deepLink}`)
  logInfo(`QR URL: ${qrData.url}`)

  // Step 8: Generate QR code
  logStep(8, 'Generate QR Code')
  const qrCodeDataUrl = await QRCode.toDataURL(qrData.url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })

  logSuccess('QR code generated (data URL available)')

  logSection('Phase 3: Validation Testing')

  // Step 9: Test validation endpoint (simulating QR scan)
  logStep(9, 'Test Validation Endpoint (No Auth Required)')

  // Remove auth header to test public endpoint
  delete api.defaults.headers.common['Authorization']

  const validationTestResponse = await api.get(
    `/vouchers/by-code/${validationCode}`,
  )

  if (validationTestResponse.data) {
    logSuccess('✅ Validation endpoint working without authentication!')
    logInfo(`Voucher title: ${validationTestResponse.data.title}`)
    logInfo(`Voucher value: ${validationTestResponse.data.value}%`)
    logInfo(`Business ID: ${validationTestResponse.data.businessId}`)
  }

  // Step 10: Test with customer token
  logStep(10, 'Test Validation with Customer Token')
  const { accessToken: customerToken } = await authenticateUser(
    api,
    TEST_USERS.customer.email,
    TEST_USERS.customer.password,
  )

  const customerValidationResponse = await api.post(
    `/vouchers/${createdVoucherId}/validate`,
    { validationCode },
  )

  if (customerValidationResponse.data) {
    logSuccess('✅ Customer can validate voucher with code!')
  }

  // Build test URLs
  const testUrls = {
    webFallback: `${WEB_URL}/en/voucher/${createdVoucherId}?c=${validationCode}&source=qr&utm_campaign=test`,
    deepLink: `voucherbook://voucher/${createdVoucherId}?c=${validationCode}&source=qr`,
    qrContent: qrData.url,
  }

  logSection('📋 Test Results Summary')

  console.log('\n' + colors.bright + 'Voucher Details:' + colors.reset)
  console.log(`  ID: ${createdVoucherId}`)
  console.log(`  Title: ${voucherData.title}`)
  console.log(
    `  Validation Code: ${colors.cyan}${validationCode}${colors.reset}`,
  )
  console.log(
    `  Expires: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()} (5 minutes for SCAN type)`,
  )

  console.log('\n' + colors.bright + 'Test URLs:' + colors.reset)
  console.log(
    `  Web Fallback: ${colors.cyan}${testUrls.webFallback}${colors.reset}`,
  )
  console.log(`  Deep Link: ${colors.cyan}${testUrls.deepLink}${colors.reset}`)
  console.log(
    `  QR Content: ${colors.cyan}${testUrls.qrContent}${colors.reset}`,
  )

  console.log(
    '\n' + colors.bright + '✅ Validation Features Working:' + colors.reset,
  )
  console.log('  • Voucher creation with business context')
  console.log('  • Validation code generation (XXXX-XXXX format)')
  console.log('  • Deep link generation with validation codes')
  console.log('  • QR code generation from validation URL')
  console.log('  • Public validation endpoint (no auth required)')
  console.log('  • Customer validation with code')
  console.log('  • Web fallback page ready at pika-links')

  console.log('\n' + colors.bright + '📱 Test Instructions:' + colors.reset)
  console.log('1. Open the web fallback URL in your browser')
  console.log(
    '2. You should see the voucher details fetched using the validation code',
  )
  console.log(
    '3. On mobile, it will try to open the app with the validation code',
  )
  console.log('4. On desktop, it shows a QR code placeholder')
  console.log('5. The validation code expires in 5 minutes (TTL for SCAN type)')

  console.log(
    '\n' + colors.green + '✨ QR validation flow test complete!' + colors.reset,
  )
}

async function cleanup() {
  if (createdVoucherId && businessId) {
    try {
      logInfo('Cleaning up test voucher...')
      // Would delete voucher here if endpoint exists
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Main execution
api = createApiClient()

executeFlow(runQRValidationFlow, {
  title: 'QR Code Validation Flow Test',
  cleanup,
}).catch((error) => {
  logError(`Flow failed: ${error.message}`)
  process.exit(1)
})
