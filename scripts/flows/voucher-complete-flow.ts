#!/usr/bin/env tsx

import { AxiosInstance } from 'axios'

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

// API client
let api: AxiosInstance

// Store created entities for cleanup
const createdVouchers: string[] = []

let businessId: string | null = null
let customerVoucherId: string | null = null

// Helper function for state colors
function getStateColor(state: string): string {
  switch (state) {
    case 'published':
    case 'active':
      return colors.green
    case 'draft':
      return colors.yellow
    case 'suspended':
      return colors.yellow
    case 'expired':
      return colors.red
    default:
      return colors.dim
  }
}

// Business setup functions
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

    // Check if we have data (could be array or object)
    if (response.data) {
      // Handle both array response and single object response
      const businesses = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [response.data]

      if (businesses.length > 0) {
        const business = businesses[0] // Use the first business

        logSuccess(`Found existing business: ${business.id}`)

        // Ensure it's verified and active via admin
        if (!business.verified || !business.active) {
          logInfo('Updating business status via admin...')
          api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

          if (!business.verified) {
            await api.post(`/admin/businesses/${business.id}/verify`, {
              verified: true,
            })
          }

          if (!business.active) {
            await api.post(`/admin/businesses/${business.id}/activate`, {})
          }

          logSuccess('Business verified and activated')
        }

        return business.id
      }
    }
  } catch (error: any) {
    // Business doesn't exist, need to create one
    logInfo('No existing business found')
  }

  // Create new business as business owner
  logInfo('Creating new business...')
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`

  const createResponse = await api.post('/businesses/me', {
    businessName: `Test Voucher Business ${timestamp}`,
    businessDescription: 'A test business for voucher flow testing',
    categoryId: categoryId,
  })

  const businessId = createResponse.data.id

  logSuccess(`Business created: ${businessId}`)

  // Verify and activate via admin
  logInfo('Verifying and activating business via admin...')
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  await api.post(`/admin/businesses/${businessId}/verify`, { verified: true })
  await api.post(`/admin/businesses/${businessId}/activate`, {})

  logSuccess('Business verified and activated')

  return businessId
}

// Voucher management functions
async function createVoucher(voucherData: any): Promise<string> {
  const response = await api.post('/admin/vouchers', voucherData)

  logSuccess(`Voucher created: ${response.data.id}`)

  return response.data.id
}

async function generateVoucherCodes(voucherId: string): Promise<string[]> {
  const response = await api.post(`/admin/vouchers/${voucherId}/codes`, {
    codeType: 'qr',
    quantity: 5,
  })

  const codes = response.data.codes?.map((c: any) => c.code) || []

  logSuccess(`Generated ${codes.length} voucher codes`)

  return codes
}

async function publishVoucher(voucherId: string): Promise<void> {
  await api.post(`/admin/vouchers/${voucherId}/publish`, {})
  logSuccess('Voucher published')
}

async function listBusinessVouchers(businessId: string): Promise<any[]> {
  const response = await api.get(
    `/admin/vouchers?businessId=${businessId}&limit=50`,
  )
  const vouchers = response.data.data || []

  logSuccess(`Found ${vouchers.length} vouchers for business`)

  if (vouchers.length > 0) {
    console.log(`\n${colors.cyan}📋 Voucher List:${colors.reset}`)
    console.log('─'.repeat(80))

    vouchers.forEach((voucher: any, index: number) => {
      console.log(
        `\n${colors.bright}${index + 1}. ${voucher.title?.en || 'Untitled'}${colors.reset}`,
      )
      console.log(`   ID: ${colors.dim}${voucher.id}${colors.reset}`)
      console.log(
        `   Type: ${voucher.discountType} (${voucher.discountValue}${voucher.discountType === 'percentage' ? '%' : ' ' + voucher.currency})`,
      )
      console.log(
        `   State: ${getStateColor(voucher.state)}${voucher.state}${colors.reset}`,
      )
      console.log(
        `   Redemptions: ${voucher.currentRedemptions || 0}/${voucher.maxRedemptions || '∞'}`,
      )
    })

    console.log('\n' + '─'.repeat(80))
  }

  return vouchers
}

// Customer voucher operations
async function scanVoucher(
  voucherCode: string,
  customerToken: string,
): Promise<any> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.post('/vouchers/scan', {
    code: voucherCode,
    scanSource: 'qr_code',
    location: {
      latitude: -25.2637,
      longitude: -57.5759,
    },
  })

  logSuccess('Voucher scanned successfully')
  logInfo(`Voucher: ${response.data.voucher.title?.en}`)
  logInfo(
    `Discount: ${response.data.voucher.discountValue}${response.data.voucher.discountType === 'percentage' ? '%' : ' ' + response.data.voucher.currency}`,
  )

  return response.data
}

async function claimVoucher(
  voucherId: string,
  customerToken: string,
): Promise<string> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.post(`/vouchers/${voucherId}/claim`, {})

  logSuccess('Voucher claimed successfully')
  logInfo(`Customer voucher ID: ${response.data.customerVoucherId}`)

  return response.data.customerVoucherId
}

async function redeemVoucher(
  voucherId: string,
  customerVoucherId: string,
  businessToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`

  const response = await api.post(`/vouchers/${voucherId}/redeem`, {
    customerVoucherId: customerVoucherId,
    location: {
      latitude: -25.2637,
      longitude: -57.5759,
    },
  })

  logSuccess('Voucher redeemed successfully')
  logInfo(`Redemption ID: ${response.data.redemptionId}`)
}

async function getUserVouchers(customerToken: string): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.get('/vouchers/user')

  logSuccess(`Found ${response.data.data.length} vouchers for user`)

  if (response.data.data.length > 0) {
    console.log(`\n${colors.cyan}📱 User's Vouchers:${colors.reset}`)
    console.log('─'.repeat(80))

    response.data.data.forEach((item: any, index: number) => {
      console.log(
        `\n${colors.bright}${index + 1}. ${item.voucher?.title?.en || 'Untitled'}${colors.reset}`,
      )
      console.log(
        `   Status: ${getStateColor(item.status)}${item.status}${colors.reset}`,
      )
      console.log(
        `   Claimed: ${new Date(item.claimedAt).toLocaleDateString()}`,
      )
      if (item.redeemedAt) {
        console.log(
          `   Redeemed: ${new Date(item.redeemedAt).toLocaleDateString()}`,
        )
      }
    })

    console.log('\n' + '─'.repeat(80))
  }
}

async function getVoucherAnalytics(
  voucherId: string,
  adminToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  const response = await api.get(`/admin/vouchers/${voucherId}/analytics`)

  logSuccess('Voucher analytics retrieved')
  logInfo(`Total scans: ${response.data.totalScans}`)
  logInfo(`Total claims: ${response.data.totalClaims}`)
  logInfo(`Total redemptions: ${response.data.totalRedemptions}`)
}

// Main flow
async function runCompleteVoucherFlow() {
  // Initialize API client
  api = createApiClient()

  // Ensure test users exist
  await createTestUsers()

  // Phase 1: Setup
  logSection('Phase 1: Authentication & Setup')

  logStep(1, 'Authenticate as Admin')

  const { accessToken: adminToken } = await authenticateUser(
    api,
    TEST_USERS.admin.email,
    TEST_USERS.admin.password,
  )

  logStep(2, 'Get Categories')

  const categoriesResponse = await api.get('/categories')
  const categories = categoriesResponse.data.data

  if (categories.length === 0) {
    throw new Error('No categories found. Please run category setup first.')
  }

  const selectedCategory = categories[0]

  logInfo(`Using category: ${selectedCategory.name} (${selectedCategory.id})`)

  logStep(3, 'Setup Business')

  const { accessToken: businessToken } = await authenticateUser(
    api,
    TEST_USERS.business.email,
    TEST_USERS.business.password,
  )

  businessId = await getOrCreateBusiness(
    businessToken,
    adminToken,
    selectedCategory.id,
  )

  // Phase 2: Create Vouchers
  logSection('Phase 2: Create & Publish Vouchers')

  // Set admin token for voucher creation
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  logStep(4, 'Create Percentage Discount Voucher')

  const percentageVoucherId = await createVoucher({
    businessId: businessId,
    categoryId: selectedCategory.id,
    title: {
      en: `20% Off Special - ${timestamp}`,
      es: `20% de Descuento Especial - ${timestamp}`,
      gn: `20% Jepi Especial - ${timestamp}`,
    },
    description: {
      en: 'Get 20% off on all services',
      es: 'Obtén 20% de descuento en todos los servicios',
      gn: "Ejapova'erã 20% opaite servicio-pe",
    },
    termsAndConditions: {
      en: 'Valid for 30 days',
      es: 'Válido por 30 días',
      gn: 'Oikovéta 30 ára',
    },
    discountType: 'percentage',
    discountValue: 20,
    currency: 'PYG',
    validFrom: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxRedemptions: 100,
    maxRedemptionsPerUser: 2,
  })

  createdVouchers.push(percentageVoucherId)

  logStep(5, 'Create Fixed Amount Voucher')

  const fixedVoucherId = await createVoucher({
    businessId: businessId,
    categoryId: selectedCategory.id,
    title: {
      en: `₲50,000 Off - ${timestamp}`,
      es: `₲50,000 de Descuento - ${timestamp}`,
      gn: `₲50,000 Jepi - ${timestamp}`,
    },
    description: {
      en: 'Save ₲50,000 on purchases',
      es: 'Ahorra ₲50,000 en compras',
      gn: 'Eñongatu ₲50,000 jogua-pe',
    },
    termsAndConditions: {
      en: 'Minimum purchase required',
      es: 'Compra mínima requerida',
      gn: 'Jogua michĩvéva ñeikotevẽ',
    },
    discountType: 'fixed',
    discountValue: 50000,
    currency: 'PYG',
    validFrom: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
  })

  createdVouchers.push(fixedVoucherId)

  logStep(6, 'Generate Voucher Codes')

  const voucherCodes = await generateVoucherCodes(percentageVoucherId)

  logInfo(`Generated codes: ${voucherCodes.slice(0, 3).join(', ')}...`)

  logStep(7, 'Publish Vouchers')

  for (const voucherId of createdVouchers) {
    await publishVoucher(voucherId)
  }

  logStep(8, 'List Business Vouchers')
  await listBusinessVouchers(businessId)

  // Phase 3: Customer Interaction
  logSection('Phase 3: Customer Voucher Journey')

  logStep(9, 'Authenticate as Customer')

  const { accessToken: customerToken } = await authenticateUser(
    api,
    TEST_USERS.customer.email,
    TEST_USERS.customer.password,
  )

  logStep(10, 'Scan Voucher QR Code')

  const scanResult = await scanVoucher(voucherCodes[0], customerToken)
  const scannedVoucherId = scanResult.voucher.id

  logStep(11, 'Claim Voucher')
  customerVoucherId = await claimVoucher(scannedVoucherId, customerToken)

  logStep(12, 'View User Vouchers')
  await getUserVouchers(customerToken)

  // Phase 4: Business Redemption
  logSection('Phase 4: Voucher Redemption')

  logStep(13, 'Business Redeems Customer Voucher')
  await redeemVoucher(scannedVoucherId, customerVoucherId, businessToken)

  logStep(14, 'View Updated User Vouchers')
  await getUserVouchers(customerToken)

  // Phase 5: Analytics
  logSection('Phase 5: Analytics & Monitoring')

  logStep(15, 'Get Voucher Analytics')
  await getVoucherAnalytics(percentageVoucherId, adminToken)

  logStep(16, 'Get Business Statistics')
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  try {
    const statsResponse = await api.get(
      `/admin/vouchers/business/${businessId}/stats`,
    )

    logSuccess('Business statistics retrieved')
    logInfo(`Total vouchers: ${statsResponse.data.totalVouchers}`)
    logInfo(`Active vouchers: ${statsResponse.data.activeVouchers}`)
    logInfo(`Total redemptions: ${statsResponse.data.totalRedemptions}`)
  } catch (error: any) {
    logInfo('Business stats endpoint not available')
  }

  // Summary
  logSection('Flow Summary')
  logSuccess(`Created ${createdVouchers.length} vouchers`)
  logSuccess('Generated QR codes for vouchers')
  logSuccess('Customer scanned, claimed, and redeemed voucher')
  logSuccess('Complete voucher lifecycle demonstrated')

  // Cleanup decision
  const shouldCleanup = process.env.CLEANUP_VOUCHERS !== 'false'

  if (!shouldCleanup) {
    logInfo('Vouchers kept for testing (set CLEANUP_VOUCHERS=true to clean up)')
    logInfo('Created voucher IDs:')
    createdVouchers.forEach((id) => console.log(`  - ${id}`))
  }
}

// Cleanup function
async function cleanup() {
  if (process.env.CLEANUP_VOUCHERS === 'false') {
    logInfo('Skipping cleanup as requested')

    return
  }

  if (createdVouchers.length > 0) {
    logInfo('Deleting test vouchers...')

    for (const voucherId of createdVouchers) {
      try {
        await api.delete(`/admin/vouchers/${voucherId}`)
        logSuccess(`Deleted voucher: ${voucherId}`)
      } catch (error: any) {
        logError(`Failed to delete voucher ${voucherId}: ${error.message}`)
      }
    }
  }
}

// Execute the flow
executeFlow(runCompleteVoucherFlow, {
  title: 'Complete Voucher Flow',
  cleanup: cleanup,
}).catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
