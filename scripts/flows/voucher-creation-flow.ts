#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios'

import { createTestUsers, TEST_USERS } from './setup-test-users.js'

// API Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:5500'
const API_PREFIX = '/api/v1'

// Test data - use pre-created verified users
const testAdmin = TEST_USERS.find((u) => u.role === 'admin')!
const testBusinessOwner = TEST_USERS.find(
  (u) => u.role === 'business' && u.emailVerified,
)!

// Add timestamp to make vouchers unique
const timestamp = Date.now()

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

// Helper functions
const log = (message: string) => console.log(message)
const logStep = (step: number, title: string) =>
  log(`${colors.cyan}\n${colors.bright}Step ${step}: ${title}${colors.reset}`)
const logSuccess = (message: string) =>
  log(`${colors.green}✅ ${message}${colors.reset}`)
const logError = (message: string) =>
  log(`${colors.red}❌ ${message}${colors.reset}`)
const logInfo = (message: string) =>
  log(`${colors.blue}ℹ️  ${message}${colors.reset}`)
const logRequest = (method: string, path: string, data?: any) => {
  log(`${colors.yellow}\n🔄 ${method} ${path}${colors.reset}`)
  if (data) {
    log(
      `${colors.dim}Request body: ${JSON.stringify(data, null, 2)}${colors.reset}`,
    )
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_GATEWAY_URL}${API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request/response interceptors for debugging
api.interceptors.request.use((config) => {
  const startTime = Date.now()

  config.metadata = { startTime }

  return config
})

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime

    log(`${colors.green}Response ${response.status}:${colors.reset}`)
    log(`${colors.dim}${JSON.stringify(response.data, null, 2)}${colors.reset}`)
    log(`${colors.dim}⏱️  Duration: ${duration}ms${colors.reset}`)

    return response
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : 0

    log(`${colors.red}Response ${error.response?.status}:${colors.reset}`)
    log(
      `${colors.dim}${JSON.stringify(error.response?.data, null, 2)}${colors.reset}`,
    )
    if (duration) {
      log(`${colors.dim}⏱️  Duration: ${duration}ms${colors.reset}`)
    }

    return Promise.reject(error)
  },
)

// Auth functions
async function loginAsAdmin(): Promise<string> {
  logInfo('Logging in as admin...')

  try {
    const response = await api.post('/auth/token', {
      grantType: 'password',
      username: testAdmin.email,
      password: testAdmin.password,
    })

    logSuccess('Admin logged in successfully')

    return response.data.accessToken
  } catch (error: any) {
    logError(
      `Admin login failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function loginAsBusinessOwner(): Promise<string> {
  logInfo('Logging in as business owner...')

  try {
    const response = await api.post('/auth/token', {
      grantType: 'password',
      username: testBusinessOwner.email,
      password: testBusinessOwner.password,
    })

    logSuccess('Business owner logged in successfully')

    return response.data.accessToken
  } catch (error: any) {
    logError(
      `Business owner login failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Setup functions
async function getBusinessForUser(
  businessOwnerToken: string,
  adminToken: string,
  categoryId: string,
): Promise<any> {
  // Get user info to find their business via admin endpoint
  const userResponse = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${businessOwnerToken}` },
  })
  const userId = userResponse.data.id

  logInfo(`Looking for business for user: ${userId}`)

  // Try to find business via admin endpoint
  logRequest('GET', `/admin/businesses?userId=${userId}`)

  try {
    const businessesResponse = await api.get(
      `/admin/businesses?userId=${userId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    )

    if (businessesResponse.data.data.length > 0) {
      const business = businessesResponse.data.data[0]

      logSuccess(`Found existing business: ${business.id}`)

      // Make sure it's verified and active
      if (!business.verified || !business.active) {
        logInfo('Updating business status...')
        await api.post(
          `/admin/businesses/${business.id}/verify`,
          { verified: true },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          },
        )
        await api.post(
          `/admin/businesses/${business.id}/activate`,
          {},
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          },
        )
        logSuccess('Business verified and activated')
      }

      return business
    } else {
      logInfo('No business found, creating one...')

      // Create a business via admin endpoint
      const businessData = {
        userId: userId,
        businessName: `Test Voucher Business ${timestamp}`,
        businessDescription: 'A test business for voucher creation flow',
        categoryId: categoryId,
        verified: true,
        active: true,
      }

      logRequest('POST', '/admin/businesses', businessData)

      const createResponse = await api.post('/admin/businesses', businessData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      logSuccess('Business created and verified successfully')

      return createResponse.data
    }
  } catch (error: any) {
    logError(
      `Failed to get/create business: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getCategories(token: string): Promise<any[]> {
  logRequest('GET', '/categories')

  try {
    const response = await api.get('/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Found ${response.data.data.length} categories`)

    return response.data.data
  } catch (error: any) {
    logError(
      `Failed to get categories: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Voucher management functions
async function createVoucher(token: string, voucherData: any): Promise<string> {
  logRequest('POST', '/admin/vouchers', voucherData)

  try {
    const response = await api.post('/admin/vouchers', voucherData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Voucher created: ${response.data.id}`)

    return response.data.id
  } catch (error: any) {
    logError(
      `Voucher creation failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getVoucherById(voucherId: string, token: string): Promise<any> {
  logRequest('GET', `/admin/vouchers/${voucherId}`)

  try {
    const response = await api.get(`/admin/vouchers/${voucherId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Voucher retrieved successfully')

    return response.data
  } catch (error: any) {
    logError(
      `Failed to get voucher: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function listBusinessVouchers(
  businessId: string,
  token: string,
): Promise<any[]> {
  logRequest('GET', `/admin/vouchers?businessId=${businessId}&limit=50`)

  try {
    const response = await api.get(`/admin/vouchers?businessId=${businessId}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const vouchers = response.data.data || []
    
    logSuccess(`Found ${vouchers.length} vouchers for business`)
    logInfo(`Total vouchers: ${response.data.pagination?.total || vouchers.length}`)
    
    // Display vouchers in a formatted way
    if (vouchers.length > 0) {
      console.log(`\n${colors.cyan}📋 Voucher List:${colors.reset}`)
      console.log('─'.repeat(80))
      
      vouchers.forEach((voucher: any, index: number) => {
        console.log(`\n${colors.bright}${index + 1}. ${voucher.title?.en || 'Untitled'}${colors.reset}`)
        console.log(`   ID: ${colors.dim}${voucher.id}${colors.reset}`)
        console.log(`   Type: ${voucher.discountType} (${voucher.discountValue}${voucher.discountType === 'percentage' ? '%' : ' ' + voucher.currency})`)
        console.log(`   State: ${getStateColor(voucher.state)}${voucher.state}${colors.reset}`)
        console.log(`   Valid: ${new Date(voucher.validFrom).toLocaleDateString()} - ${new Date(voucher.expiresAt).toLocaleDateString()}`)
        console.log(`   Redemptions: ${voucher.currentRedemptions || 0}/${voucher.maxRedemptions || '∞'}`)
        if (voucher.codes && voucher.codes.length > 0) {
          console.log(`   Codes: ${voucher.codes.length} generated`)
        }
      })
      
      console.log('\n' + '─'.repeat(80))
    }
    
    return vouchers
  } catch (error: any) {
    logError(
      `Failed to list business vouchers: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

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

async function updateVoucher(
  voucherId: string,
  token: string,
  updateData: any,
): Promise<void> {
  logRequest('PATCH', `/admin/vouchers/${voucherId}`, updateData)

  try {
    await api.patch(`/admin/vouchers/${voucherId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Voucher updated successfully')
  } catch (error: any) {
    logError(
      `Voucher update failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function publishVoucher(voucherId: string, token: string): Promise<void> {
  logRequest('POST', `/admin/vouchers/${voucherId}/publish`)

  try {
    await api.post(
      `/admin/vouchers/${voucherId}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logSuccess('Voucher published successfully')
  } catch (error: any) {
    logError(
      `Voucher publish failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function generateVoucherCodes(
  voucherId: string,
  token: string,
  codeData: any,
): Promise<void> {
  logRequest('POST', `/admin/vouchers/${voucherId}/codes`, codeData)

  try {
    const response = await api.post(
      `/admin/vouchers/${voucherId}/codes`,
      codeData,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logSuccess(`Generated ${response.data.codes?.length || 0} voucher codes`)
  } catch (error: any) {
    logError(
      `Code generation failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getVoucherAnalytics(
  voucherId: string,
  token: string,
): Promise<void> {
  logRequest('GET', `/admin/vouchers/${voucherId}/analytics`)

  try {
    const response = await api.get(`/admin/vouchers/${voucherId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Voucher analytics retrieved')
    logInfo(`Total scans: ${response.data.totalScans}`)
    logInfo(`Total claims: ${response.data.totalClaims}`)
    logInfo(`Total redemptions: ${response.data.totalRedemptions}`)
  } catch (error: any) {
    logError(
      `Failed to get analytics: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function expireVoucher(voucherId: string, token: string): Promise<void> {
  logRequest('POST', `/admin/vouchers/${voucherId}/expire`)

  try {
    await api.post(
      `/admin/vouchers/${voucherId}/expire`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logSuccess('Voucher expired successfully')
  } catch (error: any) {
    logError(
      `Voucher expiration failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function deleteVoucher(voucherId: string, token: string): Promise<void> {
  logRequest('DELETE', `/admin/vouchers/${voucherId}`)

  try {
    await api.delete(`/admin/vouchers/${voucherId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Voucher deleted successfully')
  } catch (error: any) {
    logError(
      `Voucher deletion failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Main flow
async function runVoucherCreationFlow() {
  log(`\n${colors.bright}🎫 Starting Voucher Creation Flow${colors.reset}`)
  log(`API Gateway URL: ${API_GATEWAY_URL}`)

  let adminToken: string = ''
  let businessDetails: any = null
  let categories: any[] = []

  const createdVouchers: string[] = []

  try {
    // Ensure test users exist
    log(`\n${colors.bright}=== Setup: Ensuring Test Users ===${colors.reset}`)
    await createTestUsers()

    // Phase 1: Setup and Authentication
    log(
      `\n${colors.bright}=== Phase 1: Authentication & Setup ===${colors.reset}`,
    )

    logStep(1, 'Admin Authentication')
    adminToken = await loginAsAdmin()

    logStep(2, 'Get Available Categories')
    categories = await getCategories(adminToken)

    let selectedCategory

    if (categories.length === 0) {
      logInfo('No categories found, creating one...')

      // Create a category for vouchers
      const categoryData = {
        nameKey: `category.voucher.test.${timestamp}`,
        descriptionKey: 'category.voucher.test.description',
        icon: 'voucher',
        isActive: true,
        sortOrder: 1,
      }
      const categoryResponse = await api.post(
        '/admin/categories',
        categoryData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      )

      selectedCategory = categoryResponse.data
      logSuccess(`Created category: ${selectedCategory.nameKey}`)
    } else {
      selectedCategory = categories[0]
      logInfo(
        `Using existing category: ${selectedCategory.name || selectedCategory.nameKey} (${selectedCategory.id})`,
      )
    }

    logStep(3, 'Setup Business Details')

    const businessOwnerToken = await loginAsBusinessOwner()

    businessDetails = await getBusinessForUser(
      businessOwnerToken,
      adminToken,
      selectedCategory.id,
    )

    // Phase 2: Voucher Creation
    log(
      `\n${colors.bright}=== Phase 2: Create Different Types of Vouchers ===${colors.reset}`,
    )

    logStep(4, 'Create Percentage Discount Voucher (20% off)')

    const percentageVoucher = await createVoucher(adminToken, {
      businessId: businessDetails.id,
      categoryId: selectedCategory.id,
      title: {
        en: `20% Off Special - ${timestamp}`,
        es: `20% de Descuento Especial - ${timestamp}`,
        gn: `20% Jepi Especial - ${timestamp}`,
      },
      description: {
        en: 'Get 20% off on all services. Limited time offer!',
        es: '¡Obtén 20% de descuento en todos los servicios. ¡Oferta por tiempo limitado!',
        gn: "¡Ejapova'erã 20% opaite servicio-pe. Oferta sapy'agua!",
      },
      termsAndConditions: {
        en: 'Valid for 30 days. Cannot be combined with other offers.',
        es: 'Válido por 30 días. No se puede combinar con otras ofertas.',
        gn: 'Oikovéta 30 ára. Ndaikatúi oñembojuaju ambue oferta ndive.',
      },
      discountType: 'percentage',
      discountValue: 20,
      currency: 'PYG',
      validFrom: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
    })

    createdVouchers.push(percentageVoucher)

    logStep(5, 'Create Fixed Amount Voucher (50,000 PYG off)')

    const fixedAmountVoucher = await createVoucher(adminToken, {
      businessId: businessDetails.id,
      categoryId: selectedCategory.id,
      title: {
        en: `₲50,000 Off Voucher - ${timestamp}`,
        es: `Voucher de ₲50,000 de Descuento - ${timestamp}`,
        gn: `Voucher ₲50,000 Jepi - ${timestamp}`,
      },
      description: {
        en: 'Save ₲50,000 on purchases over ₲200,000',
        es: 'Ahorra ₲50,000 en compras superiores a ₲200,000',
        gn: 'Eñongatu ₲50,000 jogua ₲200,000 guive',
      },
      termsAndConditions: {
        en: 'Minimum purchase of ₲200,000 required. Valid for 60 days.',
        es: 'Compra mínima de ₲200,000 requerida. Válido por 60 días.',
        gn: "Jogua michĩvéva ₲200,000 ñeikotevẽ. Oikovéta 60 ára.",
      },
      discountType: 'fixed',
      discountValue: 50000,
      currency: 'PYG',
      validFrom: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      maxRedemptions: 50,
      maxRedemptionsPerUser: 1,
    })

    createdVouchers.push(fixedAmountVoucher)

    logStep(6, 'Create Free Service Voucher (100% off)')

    const freeServiceVoucher = await createVoucher(adminToken, {
      businessId: businessDetails.id,
      categoryId: selectedCategory.id,
      title: {
        en: `Free Service Voucher - ${timestamp}`,
        es: `Voucher de Servicio Gratis - ${timestamp}`,
        gn: `Voucher Servicio Reirei - ${timestamp}`,
      },
      description: {
        en: 'Get one service completely free! Perfect for first-time customers.',
        es: '¡Obtén un servicio completamente gratis! Perfecto para clientes primerizos.',
        gn: '¡Ereko peteĩ servicio reirei! Iporãiterei cliente pyahu-pe.',
      },
      termsAndConditions: {
        en: 'Valid for new customers only. Cannot be used with premium services.',
        es: 'Válido solo para clientes nuevos. No se puede usar con servicios premium.',
        gn: 'Oikovéta cliente pyahu-peañõ. Ndaikatúi ojepuru servicio premium ndive.',
      },
      discountType: 'percentage',
      discountValue: 100,
      currency: 'PYG',
      validFrom: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      maxRedemptions: 25,
      maxRedemptionsPerUser: 1,
    })

    createdVouchers.push(freeServiceVoucher)

    // Phase 3: Voucher Management
    log(`\n${colors.bright}=== Phase 3: Voucher Management ===${colors.reset}`)

    logStep(7, 'List All Business Vouchers')
    const allVouchers = await listBusinessVouchers(businessDetails.id, adminToken)

    logStep(8, 'Get Detailed Voucher Information')
    await getVoucherById(percentageVoucher, adminToken)

    logStep(9, 'Update Voucher Information')
    await updateVoucher(percentageVoucher, adminToken, {
      description: {
        en: 'UPDATED: Get 20% off on all services. Extended offer!',
        es: 'ACTUALIZADO: ¡Obtén 20% de descuento en todos los servicios. ¡Oferta extendida!',
        gn: "OÑEMOAMBUE: ¡Ejapova'erã 20% opaite servicio-pe. Oferta ipukuve!",
      },
      maxRedemptions: 150, // Increase limit
    })

    logStep(10, 'Generate Voucher Codes')
    await generateVoucherCodes(percentageVoucher, adminToken, {
      codeType: 'qr',
      quantity: 10,
    })

    logStep(11, 'Publish Vouchers')

    for (const voucherId of createdVouchers) {
      await publishVoucher(voucherId, adminToken)
    }

    // Phase 4: Analytics and Monitoring
    log(
      `\n${colors.bright}=== Phase 4: Analytics & Monitoring ===${colors.reset}`,
    )

    logStep(12, 'Get Voucher Analytics')
    await getVoucherAnalytics(percentageVoucher, adminToken)

    logStep(13, 'Get Business Voucher Statistics')
    try {
      const response = await api.get(
        `/admin/vouchers/business/${businessDetails.id}/stats`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      )

      logSuccess('Business voucher statistics retrieved')
      logInfo(`Total vouchers: ${response.data.totalVouchers}`)
      logInfo(`Active vouchers: ${response.data.activeVouchers}`)
      logInfo(`Total redemptions: ${response.data.totalRedemptions}`)
    } catch (error: any) {
      logError(
        `Failed to get business stats: ${error.response?.data?.message || error.message}`,
      )
    }

    // Phase 5: Voucher Lifecycle Management
    log(
      `\n${colors.bright}=== Phase 5: Voucher Lifecycle Management ===${colors.reset}`,
    )

    logStep(14, 'Expire Test Voucher')
    await expireVoucher(freeServiceVoucher, adminToken)

    logStep(15, 'Update Voucher State')
    try {
      await api.put(
        `/admin/vouchers/${fixedAmountVoucher}/state`,
        {
          state: 'suspended',
          reason: 'Temporarily pausing voucher for maintenance',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      )
      logSuccess('Voucher state updated to suspended')
    } catch (error: any) {
      logError(
        `Failed to update voucher state: ${error.response?.data?.message || error.message}`,
      )
    }

    // Phase 6: Cleanup (optional - comment out to keep vouchers)
    const shouldCleanup = process.env.CLEANUP_VOUCHERS !== 'false'
    
    if (shouldCleanup) {
      log(`\n${colors.bright}=== Phase 6: Cleanup ===${colors.reset}`)

      logStep(16, 'Delete Test Vouchers')

      for (const voucherId of createdVouchers) {
        await deleteVoucher(voucherId, adminToken)
      }
    } else {
      log(`\n${colors.yellow}⚠️  Skipping cleanup - vouchers kept for testing${colors.reset}`)
      log(`Created voucher IDs:`)
      createdVouchers.forEach(id => log(`  - ${id}`))
    }

    log(
      `\n${colors.bright}${colors.green}✅ Voucher Creation Flow Completed Successfully!${colors.reset}`,
    )
    log(`\nFlow Summary:`)
    log(`- Created ${createdVouchers.length} different types of vouchers`)
    log(`- Demonstrated percentage, fixed amount, and free service vouchers`)
    log(
      `- Managed voucher lifecycle: create → publish → update → expire → ${shouldCleanup ? 'delete' : 'keep'}`,
    )
    log(`- Generated voucher codes and viewed analytics`)
    log(`- Complete business voucher management demonstrated`)
    
    if (!shouldCleanup) {
      log(`\n${colors.yellow}To cleanup vouchers later, set CLEANUP_VOUCHERS=true${colors.reset}`)
    }
  } catch (error: any) {
    log(
      `\n${colors.bright}${colors.red}❌ Voucher Creation Flow Failed!${colors.reset}`,
    )
    if (error.response) {
      log(`\nError details:`)
      log(`Status: ${error.response.status}`)
      log(`Message: ${error.response.data?.message || error.message}`)
      if (error.response.data?.errors) {
        log(`Validation errors: ${JSON.stringify(error.response.data.errors, null, 2)}`)
      }
    } else {
      log(`\nError: ${error.message}`)
    }
    process.exit(1)
  }
}

// Run the flow
runVoucherCreationFlow().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})