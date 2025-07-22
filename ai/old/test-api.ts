#!/usr/bin/env tsx

import axios from 'axios'

const API_BASE_URL = 'http://localhost:5500/api/v1'

// Admin user credentials (from seed data)
const adminCredentials = {
  email: 'admin@solo60.com',
  password: 'Admin123!',
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

async function getAdminToken(): Promise<string> {
  try {
    console.log('🔐 Getting admin token...')

    const response = await axios.post<TokenResponse>(
      `${API_BASE_URL}/auth/token`,
      {
        grantType: 'password',
        username: adminCredentials.email,
        password: adminCredentials.password,
      },
    )

    console.log('✅ Token obtained successfully')

    return response.data.accessToken
  } catch (error: any) {
    console.error(
      '❌ Failed to get token:',
      error.response?.data || error.message,
    )
    process.exit(1)
  }
}

async function testRoute(
  method: string,
  path: string,
  token: string,
  data?: any,
  description?: string,
) {
  try {
    console.log(`\n📍 Testing: ${method} ${path}`)
    if (description) console.log(`   ${description}`)

    const response = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data,
    })

    console.log(`✅ Success (${response.status})`)
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2))
    }

    return response.data
  } catch (error: any) {
    console.error(`❌ Failed (${error.response?.status || 'unknown'})`)
    if (error.response?.data) {
      console.error('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }

    return null
  }
}

async function main() {
  console.log('🚀 Solo60 API Test Script')
  console.log('========================\n')

  // Get admin token
  const token = await getAdminToken()

  // Test 1: Get users with different status filters
  console.log('\n📋 Testing User Status Filters')
  console.log('================================')

  const statuses = ['ACTIVE', 'BANNED', 'UNCONFIRMED', 'INACTIVE']

  for (const status of statuses) {
    const result = await testRoute(
      'GET',
      `/users?page=1&limit=5&status=${status}&sortBy=CREATED_AT&sortOrder=DESC`,
      token,
      undefined,
      `Filter by status: ${status}`,
    )

    if (result?.data) {
      console.log(`\n   📊 Results for status=${status}:`)
      console.log(`   Total found: ${result.data.length} users`)

      // Check if all returned users have the requested status
      const correctStatus = result.data.filter(
        (user: any) => user.status === status,
      ).length
      const wrongStatus = result.data.filter(
        (user: any) => user.status !== status,
      )

      if (wrongStatus.length > 0) {
        console.log(
          `   ⚠️  WARNING: Found ${wrongStatus.length} users with WRONG status!`,
        )
        wrongStatus.forEach((user: any) => {
          console.log(
            `      ❌ ${user.email} has status ${user.status} (expected ${status})`,
          )
        })
      } else {
        console.log(
          `   ✅ All ${correctStatus} users have correct status: ${status}`,
        )
      }

      result.data.forEach((user: any) => {
        console.log(`   - ${user.email} (${user.status})`)
      })
    }
  }

  // Test 2: Get all users without filter
  console.log('\n📋 Testing All Users (No Filter)')
  console.log('==================================')

  const allUsers = await testRoute(
    'GET',
    '/users?page=1&limit=10&sortBy=CREATED_AT&sortOrder=DESC',
    token,
    undefined,
    'Get all users without status filter',
  )

  if (allUsers?.data) {
    console.log(`\n📊 User Status Summary:`)

    const statusCounts: Record<string, number> = {}

    allUsers.data.forEach((user: any) => {
      statusCounts[user.status] = (statusCounts[user.status] || 0) + 1
    })
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} users`)
    })
  }

  // Test 3: Ban/Unban user
  console.log('\n🔨 Testing Ban/Unban Operations')
  console.log('=================================')

  // Find a test user to ban/unban
  const testUser = allUsers?.data?.find(
    (u: any) => u.email.includes('test') || u.email.includes('member'),
  )

  if (testUser) {
    console.log(`\n🎯 Testing with user: ${testUser.email} (${testUser.id})`)

    // Ban user
    await testRoute(
      'PUT',
      `/users/${testUser.id}/ban`,
      token,
      {}, // Empty body since all fields are optional
      'Ban user with empty body',
    )

    // Check user status
    await testRoute(
      'GET',
      `/users/${testUser.id}`,
      token,
      undefined,
      'Check user status after ban',
    )

    // Unban user
    await testRoute(
      'PUT',
      `/users/${testUser.id}/unban`,
      token,
      {}, // Empty body since all fields are optional
      'Unban user with empty body',
    )

    // Check user status again
    await testRoute(
      'GET',
      `/users/${testUser.id}`,
      token,
      undefined,
      'Check user status after unban',
    )
  }

  console.log('\n✅ Test script completed!')
}

// Run the script
main().catch(console.error)
