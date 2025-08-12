#!/usr/bin/env tsx
/**
 * Avatar Upload Flow Test Script
 * Tests avatar upload functionality with proper validation
 *
 * Usage: tsx scripts/flows/avatar-upload-flow.ts
 */

import {
  createApiClient,
  authenticateUser,
  executeFlow,
  logStep,
  logSuccess,
  logError,
  logInfo,
  logWarning,
  TEST_USERS,
  TestResult,
  printTestSummary,
} from './flow-utils.js'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create test images in memory
function createTestImage(format: 'png' | 'jpeg' | 'webp' | 'gif'): Buffer {
  // Create a simple 1x1 pixel image for each format
  const images = {
    // 1x1 PNG (transparent)
    png: Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c626001000000050001a7b19d3d0000000049454e44ae426082',
      'hex'
    ),
    // 1x1 JPEG (black)
    jpeg: Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00f781e0007ffd9',
      'hex'
    ),
    // 1x1 WebP (black)
    webp: Buffer.from(
      '524946462a000000574542505650384c1d0000002f0000001007100000ec0709eef71fa296be0e9246182ef608e34dc6f26e8b4a0691f43f00',
      'hex'
    ),
    // 1x1 GIF (transparent)
    gif: Buffer.from(
      '47494638396101000100800000ffffff00000021f90401000000002c00000000010001000002024401003b',
      'hex'
    ),
  }
  
  return images[format]
}

// Create a large file for testing size limits
function createLargeFile(sizeMB: number): Buffer {
  return Buffer.alloc(sizeMB * 1024 * 1024)
}

// Main flow
async function testAvatarUploadFlow() {
  const api = createApiClient()
  const results: TestResult[] = []
  
  // Step 1: Login
  logStep(1, 'Login with test user')
  const { accessToken } = await authenticateUser(
    api,
    TEST_USERS.customer.email,
    TEST_USERS.customer.password
  )
  results.push({ name: 'Authentication', success: true })
  
  // Step 2: Test valid PNG upload
  logStep(2, 'Upload valid PNG avatar')
  try {
    const form = new FormData()
    const pngImage = createTestImage('png')
    form.append('avatar', pngImage, {
      filename: 'avatar.png',
      contentType: 'image/png',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    if (response.data.avatarUrl) {
      logSuccess(`PNG avatar uploaded: ${response.data.avatarUrl}`)
      results.push({ name: 'PNG Upload', success: true })
    } else {
      throw new Error('No avatar URL returned')
    }
  } catch (error: any) {
    logError(`PNG upload failed: ${error.response?.data?.error?.message || error.message}`)
    results.push({ name: 'PNG Upload', success: false, message: error.message })
  }
  
  // Step 3: Test valid JPEG upload
  logStep(3, 'Upload valid JPEG avatar')
  try {
    const form = new FormData()
    const jpegImage = createTestImage('jpeg')
    form.append('avatar', jpegImage, {
      filename: 'avatar.jpg',
      contentType: 'image/jpeg',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    if (response.data.avatarUrl) {
      logSuccess(`JPEG avatar uploaded: ${response.data.avatarUrl}`)
      results.push({ name: 'JPEG Upload', success: true })
    } else {
      throw new Error('No avatar URL returned')
    }
  } catch (error: any) {
    logError(`JPEG upload failed: ${error.response?.data?.error?.message || error.message}`)
    results.push({ name: 'JPEG Upload', success: false, message: error.message })
  }
  
  // Step 4: Test valid WebP upload
  logStep(4, 'Upload valid WebP avatar')
  try {
    const form = new FormData()
    const webpImage = createTestImage('webp')
    form.append('avatar', webpImage, {
      filename: 'avatar.webp',
      contentType: 'image/webp',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    if (response.data.avatarUrl) {
      logSuccess(`WebP avatar uploaded: ${response.data.avatarUrl}`)
      results.push({ name: 'WebP Upload', success: true })
    } else {
      throw new Error('No avatar URL returned')
    }
  } catch (error: any) {
    logError(`WebP upload failed: ${error.response?.data?.error?.message || error.message}`)
    results.push({ name: 'WebP Upload', success: false, message: error.message })
  }
  
  // Step 5: Test invalid GIF upload (should fail)
  logStep(5, 'Upload invalid GIF avatar (should fail)')
  try {
    const form = new FormData()
    const gifImage = createTestImage('gif')
    form.append('avatar', gifImage, {
      filename: 'avatar.gif',
      contentType: 'image/gif',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    logWarning('GIF upload succeeded unexpectedly')
    results.push({ name: 'GIF Rejection', success: false, message: 'GIF was accepted' })
  } catch (error: any) {
    if (error.response?.status === 400) {
      logSuccess('GIF properly rejected with validation error')
      results.push({ name: 'GIF Rejection', success: true })
    } else {
      logError(`Unexpected error: ${error.message}`)
      results.push({ name: 'GIF Rejection', success: false, message: error.message })
    }
  }
  
  // Step 6: Test file too large (should fail)
  logStep(6, 'Upload oversized file (should fail)')
  try {
    const form = new FormData()
    const largeFile = createLargeFile(6) // 6MB, over 5MB limit
    form.append('avatar', largeFile, {
      filename: 'large.png',
      contentType: 'image/png',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    )
    
    logWarning('Large file upload succeeded unexpectedly')
    results.push({ name: 'Size Limit', success: false, message: 'Large file was accepted' })
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 413) {
      logSuccess('Large file properly rejected')
      results.push({ name: 'Size Limit', success: true })
    } else {
      logError(`Unexpected error: ${error.message}`)
      results.push({ name: 'Size Limit', success: false, message: error.message })
    }
  }
  
  // Step 7: Test wrong field name (should fail)
  logStep(7, 'Upload with wrong field name (should fail)')
  try {
    const form = new FormData()
    const pngImage = createTestImage('png')
    form.append('profile_pic', pngImage, {
      filename: 'avatar.png',
      contentType: 'image/png',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    logWarning('Wrong field name succeeded unexpectedly')
    results.push({ name: 'Field Name Validation', success: false, message: 'Wrong field accepted' })
  } catch (error: any) {
    if (error.response?.status === 400) {
      logSuccess('Wrong field name properly rejected')
      results.push({ name: 'Field Name Validation', success: true })
    } else {
      logError(`Unexpected error: ${error.message}`)
      results.push({ name: 'Field Name Validation', success: false, message: error.message })
    }
  }
  
  // Step 8: Test mismatched extension (should fail)
  logStep(8, 'Upload with mismatched extension (should fail)')
  try {
    const form = new FormData()
    const pngImage = createTestImage('png')
    // Send PNG data but claim it's a JPEG
    form.append('avatar', pngImage, {
      filename: 'avatar.jpg', // Wrong extension
      contentType: 'image/png',
    })
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    logWarning('Mismatched extension succeeded unexpectedly')
    results.push({ name: 'Extension Validation', success: false, message: 'Mismatch accepted' })
  } catch (error: any) {
    if (error.response?.status === 400) {
      logSuccess('Mismatched extension properly rejected')
      results.push({ name: 'Extension Validation', success: true })
    } else {
      logError(`Unexpected error: ${error.message}`)
      results.push({ name: 'Extension Validation', success: false, message: error.message })
    }
  }
  
  // Step 9: Test no file upload (should fail)
  logStep(9, 'Upload with no file (should fail)')
  try {
    const form = new FormData()
    // Don't append any file
    
    const response = await axios.post(
      `${api.defaults.baseURL}/users/me/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    logWarning('No file upload succeeded unexpectedly')
    results.push({ name: 'No File Validation', success: false, message: 'Empty upload accepted' })
  } catch (error: any) {
    if (error.response?.status === 400) {
      logSuccess('No file properly rejected')
      results.push({ name: 'No File Validation', success: true })
    } else {
      logError(`Unexpected error: ${error.message}`)
      results.push({ name: 'No File Validation', success: false, message: error.message })
    }
  }
  
  // Step 10: Test upload for another user (admin only)
  logStep(10, 'Test admin uploading for another user')
  try {
    // Login as admin
    const adminApi = createApiClient()
    const { accessToken: adminToken } = await authenticateUser(
      adminApi,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    )
    
    // Get a customer user
    const usersResponse = await adminApi.get('/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    
    const customerUser = usersResponse.data.data.find(
      (u: any) => u.role === 'customer' && u.email !== TEST_USERS.customer.email
    )
    
    if (customerUser) {
      const form = new FormData()
      const pngImage = createTestImage('png')
      form.append('avatar', pngImage, {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      
      const response = await axios.post(
        `${adminApi.defaults.baseURL}/users/${customerUser.id}/avatar`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )
      
      if (response.data.avatarUrl) {
        logSuccess(`Admin uploaded avatar for user ${customerUser.email}`)
        results.push({ name: 'Admin Upload for User', success: true })
      }
    } else {
      logInfo('No other customer user found for admin test')
      results.push({ name: 'Admin Upload for User', success: true, message: 'Skipped - no user' })
    }
  } catch (error: any) {
    logError(`Admin upload failed: ${error.response?.data?.error?.message || error.message}`)
    results.push({ name: 'Admin Upload for User', success: false, message: error.message })
  }
  
  // Print summary
  printTestSummary(results)
}

// Execute the flow
executeFlow(testAvatarUploadFlow, {
  title: 'Avatar Upload Flow Test',
}).catch((error) => {
  logError(`Unhandled error: ${error}`)
  process.exit(1)
})