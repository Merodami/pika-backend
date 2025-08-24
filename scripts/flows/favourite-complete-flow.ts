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

// Store test data
let businessId: string | null = null
let voucherId: string | null = null
let customerToken: string | null = null

// Helper function for status colors
function getStatusColor(isFavorited: boolean): string {
  return isFavorited ? colors.green : colors.dim
}

// Business operations
async function getOrCreateTestBusiness(
  businessToken: string,
  adminToken: string,
  categoryId: string,
): Promise<string> {
  logInfo(`Setting up test business...`)

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
    businessName: `Test Favourite Business ${timestamp}`,
    businessDescription: 'A test business for favourite flow testing',
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

async function getOrCreateTestVoucher(
  adminToken: string,
  businessId: string,
  categoryId: string,
): Promise<string> {
  logInfo('Setting up test voucher...')

  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`

  // Check for existing vouchers for this business
  try {
    const response = await api.get(
      `/admin/vouchers?businessId=${businessId}&limit=10&state=published`,
    )
    
    if (response.data.data && response.data.data.length > 0) {
      const voucher = response.data.data[0]
      logSuccess(`Found existing published voucher: ${voucher.id}`)
      return voucher.id
    }
  } catch (error) {
    logInfo('No existing vouchers found, creating new one')
  }

  // Create new voucher
  const voucherData = {
    businessId: businessId,
    categoryId: categoryId,
    title: {
      en: `Test Favourite Voucher - ${timestamp}`,
      es: `Cupón de Prueba Favorito - ${timestamp}`,
      gn: `Cupón de Prueba Favorito - ${timestamp}`,
    },
    description: {
      en: 'Special voucher for testing favourites',
      es: 'Cupón especial para probar favoritos',
      gn: 'Cupón especial oĩporãhaguã favorito',
    },
    termsAndConditions: {
      en: 'Valid for testing purposes',
      es: 'Válido para propósitos de prueba',
      gn: 'Oikóva prueba-pe guarã',
    },
    discountType: 'percentage',
    discountValue: 15,
    currency: 'PYG',
    validFrom: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    maxRedemptions: 100,
    maxRedemptionsPerUser: 3,
  }

  const createResponse = await api.post('/admin/vouchers', voucherData)
  const voucherId = createResponse.data.id

  logSuccess(`Voucher created: ${voucherId}`)

  // Publish the voucher
  await api.post(`/admin/vouchers/${voucherId}/publish`, {})
  logSuccess('Voucher published')

  return voucherId
}

// Favourite operations for Business
async function checkBusinessFavouriteStatus(
  businessId: string,
  customerToken: string,
): Promise<boolean> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.get(`/favorites/businesses/${businessId}/status`)

  const isFavorited = response.data.isFavorited
  const status = isFavorited ? 'Favorited' : 'Not favorited'
  const color = getStatusColor(isFavorited)
  
  logInfo(`Business status: ${color}${status}${colors.reset}`)
  
  if (isFavorited && response.data.favoritedAt) {
    logInfo(`Favorited at: ${new Date(response.data.favoritedAt).toLocaleString()}`)
  }

  return isFavorited
}

async function addBusinessToFavourites(
  businessId: string,
  customerToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.post(`/favorites/businesses/${businessId}`)

  logSuccess('Business added to favourites')
  logInfo(`Favourite ID: ${response.data.id}`)
  logInfo(`Added at: ${new Date(response.data.createdAt).toLocaleString()}`)
}

async function removeBusinessFromFavourites(
  businessId: string,
  customerToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  await api.delete(`/favorites/businesses/${businessId}`)

  logSuccess('Business removed from favourites')
}

async function listFavouriteBusinesses(customerToken: string): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.get('/favorites/businesses?limit=10&include=business')

  const favourites = response.data.data || []
  
  logSuccess(`Found ${favourites.length} favourite businesses`)

  if (favourites.length > 0) {
    console.log(`\n${colors.cyan}❤️  Favourite Businesses:${colors.reset}`)
    console.log('─'.repeat(80))

    favourites.forEach((item: any, index: number) => {
      console.log(
        `\n${colors.bright}${index + 1}. ${item.business?.businessName || item.businessId}${colors.reset}`,
      )
      console.log(`   Business ID: ${colors.dim}${item.businessId}${colors.reset}`)
      console.log(
        `   Added: ${new Date(item.createdAt).toLocaleDateString()}`,
      )
      if (item.business) {
        console.log(
          `   Category: ${item.business.category?.name || 'N/A'}`,
        )
        console.log(
          `   Status: ${item.business.active ? colors.green + 'Active' : colors.red + 'Inactive'}${colors.reset}`,
        )
      }
    })

    console.log('\n' + '─'.repeat(80))
  }
}

// Favourite operations for Voucher
async function checkVoucherFavouriteStatus(
  voucherId: string,
  customerToken: string,
): Promise<boolean> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.get(`/favorites/vouchers/${voucherId}/status`)

  const isFavorited = response.data.isFavorited
  const status = isFavorited ? 'Favorited' : 'Not favorited'
  const color = getStatusColor(isFavorited)
  
  logInfo(`Voucher status: ${color}${status}${colors.reset}`)
  
  if (isFavorited && response.data.favoritedAt) {
    logInfo(`Favorited at: ${new Date(response.data.favoritedAt).toLocaleString()}`)
  }

  return isFavorited
}

async function addVoucherToFavourites(
  voucherId: string,
  customerToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.post(`/favorites/vouchers/${voucherId}`)

  logSuccess('Voucher added to favourites')
  logInfo(`Favourite ID: ${response.data.id}`)
  logInfo(`Added at: ${new Date(response.data.createdAt).toLocaleString()}`)
}

async function removeVoucherFromFavourites(
  voucherId: string,
  customerToken: string,
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  await api.delete(`/favorites/vouchers/${voucherId}`)

  logSuccess('Voucher removed from favourites')
}

async function listFavouriteVouchers(customerToken: string): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const response = await api.get('/favorites/vouchers?limit=10&include=voucher,business')

  const favourites = response.data.data || []
  
  logSuccess(`Found ${favourites.length} favourite vouchers`)

  if (favourites.length > 0) {
    console.log(`\n${colors.cyan}❤️  Favourite Vouchers:${colors.reset}`)
    console.log('─'.repeat(80))

    favourites.forEach((item: any, index: number) => {
      console.log(
        `\n${colors.bright}${index + 1}. ${item.voucher?.title?.en || item.voucherId}${colors.reset}`,
      )
      console.log(`   Voucher ID: ${colors.dim}${item.voucherId}${colors.reset}`)
      console.log(
        `   Added: ${new Date(item.createdAt).toLocaleDateString()}`,
      )
      if (item.voucher) {
        console.log(
          `   Discount: ${item.voucher.discountValue}${item.voucher.discountType === 'percentage' ? '%' : ' ' + item.voucher.currency}`,
        )
        console.log(
          `   Business: ${item.voucher.business?.businessName || 'N/A'}`,
        )
        console.log(
          `   Status: ${item.voucher.state === 'published' ? colors.green + 'Active' : colors.yellow + item.voucher.state}${colors.reset}`,
        )
      }
    })

    console.log('\n' + '─'.repeat(80))
  }
}

// Batch operations
async function batchAddFavourites(
  customerToken: string,
  businessIds: string[],
  voucherIds: string[],
): Promise<void> {
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  if (businessIds.length > 0) {
    const businessResponse = await api.post('/favorites/businesses/batch', {
      add: businessIds,
    })

    logSuccess(`Batch added ${businessResponse.data.added} businesses to favourites`)
    if (businessResponse.data.errors?.length > 0) {
      logError(`Errors: ${businessResponse.data.errors.length}`)
    }
  }

  if (voucherIds.length > 0) {
    const voucherResponse = await api.post('/favorites/vouchers/batch', {
      add: voucherIds,
    })

    logSuccess(`Batch added ${voucherResponse.data.added} vouchers to favourites`)
    if (voucherResponse.data.errors?.length > 0) {
      logError(`Errors: ${voucherResponse.data.errors.length}`)
    }
  }
}

// Main flow
async function runCompleteFavouriteFlow() {
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

  businessId = await getOrCreateTestBusiness(
    businessToken,
    adminToken,
    selectedCategory.id,
  )

  logStep(4, 'Setup Voucher')

  voucherId = await getOrCreateTestVoucher(
    adminToken,
    businessId,
    selectedCategory.id,
  )

  logStep(5, 'Authenticate as Customer')

  const { accessToken } = await authenticateUser(
    api,
    TEST_USERS.customer.email,
    TEST_USERS.customer.password,
  )
  customerToken = accessToken

  // Phase 2: Business Favourites Flow
  logSection('Phase 2: Business Favourites Flow')

  logStep(6, 'Check Initial Business Favourite Status')
  const businessInitialStatus = await checkBusinessFavouriteStatus(businessId, customerToken)

  if (businessInitialStatus) {
    logInfo('Business already in favourites, removing first...')
    await removeBusinessFromFavourites(businessId, customerToken)
  }

  logStep(7, 'Add Business to Favourites')
  await addBusinessToFavourites(businessId, customerToken)

  logStep(8, 'Verify Business is Favourited')
  const businessFavoritedStatus = await checkBusinessFavouriteStatus(businessId, customerToken)
  
  if (!businessFavoritedStatus) {
    throw new Error('Business should be favourited but status shows not favourited')
  }

  logStep(9, 'List Favourite Businesses')
  await listFavouriteBusinesses(customerToken)

  logStep(10, 'Remove Business from Favourites')
  await removeBusinessFromFavourites(businessId, customerToken)

  logStep(11, 'Verify Business is Not Favourited')
  const businessRemovedStatus = await checkBusinessFavouriteStatus(businessId, customerToken)
  
  if (businessRemovedStatus) {
    throw new Error('Business should not be favourited but status shows favourited')
  }

  // Phase 3: Voucher Favourites Flow
  logSection('Phase 3: Voucher Favourites Flow')

  logStep(12, 'Check Initial Voucher Favourite Status')
  const voucherInitialStatus = await checkVoucherFavouriteStatus(voucherId, customerToken)

  if (voucherInitialStatus) {
    logInfo('Voucher already in favourites, removing first...')
    await removeVoucherFromFavourites(voucherId, customerToken)
  }

  logStep(13, 'Add Voucher to Favourites')
  await addVoucherToFavourites(voucherId, customerToken)

  logStep(14, 'Verify Voucher is Favourited')
  const voucherFavoritedStatus = await checkVoucherFavouriteStatus(voucherId, customerToken)
  
  if (!voucherFavoritedStatus) {
    throw new Error('Voucher should be favourited but status shows not favourited')
  }

  logStep(15, 'List Favourite Vouchers')
  await listFavouriteVouchers(customerToken)

  logStep(16, 'Remove Voucher from Favourites')
  await removeVoucherFromFavourites(voucherId, customerToken)

  logStep(17, 'Verify Voucher is Not Favourited')
  const voucherRemovedStatus = await checkVoucherFavouriteStatus(voucherId, customerToken)
  
  if (voucherRemovedStatus) {
    throw new Error('Voucher should not be favourited but status shows favourited')
  }

  // Phase 4: Batch Operations
  logSection('Phase 4: Batch Favourite Operations')

  logStep(18, 'Create Additional Test Data')

  // Create another business and voucher for batch testing
  logInfo('Creating additional business...')
  api.defaults.headers.common['Authorization'] = `Bearer ${businessToken}`
  
  const secondBusinessResponse = await api.post('/businesses/me', {
    businessName: `Second Test Business ${timestamp}`,
    businessDescription: 'Another test business for batch favourites',
    categoryId: selectedCategory.id,
  })
  
  const secondBusinessId = secondBusinessResponse.data.id
  
  // Verify and activate
  api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
  await api.post(`/admin/businesses/${secondBusinessId}/verify`, { verified: true })
  await api.post(`/admin/businesses/${secondBusinessId}/activate`, {})
  
  logSuccess(`Second business created: ${secondBusinessId}`)

  // Create second voucher
  const secondVoucherResponse = await api.post('/admin/vouchers', {
    businessId: businessId,
    categoryId: selectedCategory.id,
    title: {
      en: `Second Test Voucher - ${timestamp}`,
      es: `Segundo Cupón de Prueba - ${timestamp}`,
      gn: `Mokõiha Cupón de Prueba - ${timestamp}`,
    },
    description: {
      en: 'Another voucher for batch testing',
      es: 'Otro cupón para pruebas por lote',
      gn: 'Ambue cupón prueba lote-pe guarã',
    },
    termsAndConditions: {
      en: 'Valid for batch testing',
      es: 'Válido para pruebas por lote',
      gn: 'Oikóva prueba lote-pe guarã',
    },
    discountType: 'fixed',
    discountValue: 25000,
    currency: 'PYG',
    validFrom: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
  })

  const secondVoucherId = secondVoucherResponse.data.id
  await api.post(`/admin/vouchers/${secondVoucherId}/publish`, {})
  
  logSuccess(`Second voucher created: ${secondVoucherId}`)

  logStep(19, 'Batch Add Multiple Favourites')
  await batchAddFavourites(
    customerToken,
    [businessId, secondBusinessId],
    [voucherId, secondVoucherId],
  )

  logStep(20, 'Verify All Items are Favourited')
  await listFavouriteBusinesses(customerToken)
  await listFavouriteVouchers(customerToken)

  logStep(21, 'Batch Remove Favourites')
  api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`

  const batchRemoveBusinessResponse = await api.post('/favorites/businesses/batch', {
    remove: [businessId, secondBusinessId],
  })

  logSuccess(`Batch removed ${batchRemoveBusinessResponse.data.removed} businesses from favourites`)

  const batchRemoveVoucherResponse = await api.post('/favorites/vouchers/batch', {
    remove: [voucherId, secondVoucherId],
  })

  logSuccess(`Batch removed ${batchRemoveVoucherResponse.data.removed} vouchers from favourites`)

  logStep(22, 'Verify All Items are Removed')
  const finalBusinessStatus = await checkBusinessFavouriteStatus(businessId, customerToken)
  const finalVoucherStatus = await checkVoucherFavouriteStatus(voucherId, customerToken)

  if (finalBusinessStatus || finalVoucherStatus) {
    throw new Error('Items should be removed from favourites but some are still favourited')
  }

  // Summary
  logSection('Flow Summary')
  logSuccess('Business favourite operations completed successfully')
  logSuccess('Voucher favourite operations completed successfully')
  logSuccess('Batch favourite operations completed successfully')
  logSuccess('All favourite status checks passed')
  logSuccess('Complete favourite lifecycle demonstrated')

  // Cleanup note
  logInfo('Test businesses and vouchers retained for future testing')
  logInfo(`Business IDs: ${businessId}, ${secondBusinessId}`)
  logInfo(`Voucher IDs: ${voucherId}, ${secondVoucherId}`)
}

// Cleanup function
async function cleanup() {
  // No cleanup needed - we want to keep test data
  logInfo('No cleanup performed - test data retained')
}

// Execute the flow
executeFlow(runCompleteFavouriteFlow, {
  title: 'Complete Favourite Flow',
  cleanup: cleanup,
}).catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})