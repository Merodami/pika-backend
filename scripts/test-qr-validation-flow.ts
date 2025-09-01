#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import axios, { AxiosInstance } from 'axios'
import dotenv from 'dotenv'
import QRCode from 'qrcode'

// Load environment
dotenv.config({ path: '.env.local' })

const API_URL = 'http://localhost:5028' // Voucher service
const WEB_URL = 'http://localhost:3001' // pika-links

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function logStep(message: string) {
  console.log(`${colors.blue}▶${colors.reset} ${message}`)
}

function logSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
}

function logError(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`)
}

function logInfo(message: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`)
}

async function testQRValidationFlow() {
  const prisma = new PrismaClient()
  const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  try {
    console.log(
      `\n${colors.bright}🔍 Testing QR Code Validation Flow${colors.reset}\n`,
    )

    // Step 1: Get a business user token
    logStep('Getting business user token...')

    const businessUser = await prisma.user.findUnique({
      where: { email: 'business@example.com' },
    })

    if (!businessUser) {
      throw new Error('Business user not found. Run setup-test-users.ts first.')
    }

    // Generate a simple token for testing (you could also use generate-long-lived-token.ts)
    const businessToken = 'YOUR_BUSINESS_TOKEN' // Replace with actual token

    // Step 2: Get or create a business
    logStep('Finding business...')

    const business = await prisma.business.findFirst({
      where: { ownerId: businessUser.id },
    })

    if (!business) {
      throw new Error('No business found for user. Create one first.')
    }

    logSuccess(`Found business: ${business.name} (${business.id})`)

    // Step 3: Create a test voucher
    logStep('Creating test voucher...')

    const voucherData = {
      title: `QR Test Voucher ${Date.now()}`,
      description: 'Test voucher for QR code validation flow',
      discountType: 'percentage',
      value: 20,
      businessId: business.id,
      state: 'published',
      maxRedemptions: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }

    const voucherResponse = await api.post('/vouchers', voucherData, {
      headers: { Authorization: `Bearer ${businessToken}` },
    })

    const voucher = voucherResponse.data

    logSuccess(`Created voucher: ${voucher.id}`)

    // Step 4: Generate validation code for QR
    logStep('Generating validation code for QR...')

    const validationResponse = await api.post(
      `/vouchers/${voucher.id}/deep-link`,
      {
        type: 'SCAN',
        campaignId: 'test-campaign',
        source: 'testing',
      },
      {
        headers: { Authorization: `Bearer ${businessToken}` },
      },
    )

    const { validationCode, deepLink, qrData } = validationResponse.data

    logSuccess(`Generated validation code: ${validationCode}`)
    logInfo(`Deep link: ${deepLink}`)

    // Step 5: Generate QR code
    logStep('Generating QR code...')

    const qrCodeDataUrl = await QRCode.toDataURL(qrData.url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    logSuccess('QR code generated')

    // Step 6: Test validation endpoint (simulating QR scan)
    logStep('Testing validation endpoint...')

    const validationTestResponse = await api.get(
      `/vouchers/by-code/${validationCode}`,
    )

    if (validationTestResponse.data) {
      logSuccess('Validation endpoint working correctly')
      logInfo(`Voucher title: ${validationTestResponse.data.title}`)
      logInfo(`Voucher value: ${validationTestResponse.data.value}%`)
    }

    // Step 7: Build test URLs
    const testUrls = {
      webFallback: `${WEB_URL}/en/voucher/${voucher.id}?c=${validationCode}&source=qr&utm_campaign=test`,
      deepLink: `voucherbook://voucher/${voucher.id}?c=${validationCode}&source=qr`,
      qrContent: qrData.url,
    }

    // Output results
    console.log(`\n${colors.bright}📋 Test Results${colors.reset}\n`)
    console.log('Voucher Details:')
    console.log(`  ID: ${voucher.id}`)
    console.log(`  Title: ${voucher.title}`)
    console.log(`  Validation Code: ${validationCode}`)
    console.log(
      `  Expires: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()} (5 minutes)`,
    )

    console.log('\nTest URLs:')
    console.log(
      `  Web Fallback: ${colors.cyan}${testUrls.webFallback}${colors.reset}`,
    )
    console.log(
      `  Deep Link: ${colors.cyan}${testUrls.deepLink}${colors.reset}`,
    )
    console.log(
      `  QR Content: ${colors.cyan}${testUrls.qrContent}${colors.reset}`,
    )

    console.log('\n📱 QR Code (scan with phone or visit web URL):')
    console.log('  [QR code would be displayed here in a real terminal]')
    console.log(`  Data URL available: ${qrCodeDataUrl.substring(0, 50)}...`)

    console.log(`\n${colors.bright}✅ Test Instructions:${colors.reset}`)
    console.log('1. Open the web fallback URL in your browser')
    console.log('2. You should see the voucher details')
    console.log('3. On mobile, it should try to open the app')
    console.log('4. On desktop, it should show a QR code placeholder')
    console.log('5. The validation code expires in 5 minutes')

    console.log(
      `\n${colors.green}✨ QR validation flow test complete!${colors.reset}`,
    )
  } catch (error: any) {
    logError(`Test failed: ${error.message}`)
    if (error.response?.data) {
      console.error('API Error:', error.response.data)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testQRValidationFlow().catch(console.error)
