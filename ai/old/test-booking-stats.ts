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
  console.log('🚀 Solo60 Booking Stats API Test')
  console.log('=================================\n')

  // Get admin token
  const token = await getAdminToken()

  // Test 1: Get some users to test with
  console.log('\n📋 Getting Users for Testing')
  console.log('=============================')

  const usersResponse = await testRoute(
    'GET',
    '/users?page=1&limit=10&sortBy=CREATED_AT&sortOrder=DESC',
    token,
    undefined,
    'Get users to test booking stats with',
  )

  if (!usersResponse?.data || usersResponse.data.length === 0) {
    console.error('❌ No users found to test with')

    return
  }

  // Get user IDs for testing
  const userIds = usersResponse.data.slice(0, 3).map((user: any) => user.id)

  console.log(`\n🎯 Testing with ${userIds.length} users:`)
  usersResponse.data.slice(0, 3).forEach((user: any) => {
    console.log(`   - ${user.email} (${user.id})`)
  })

  // Test 2: Test the new booking stats endpoint
  console.log('\n📊 Testing Booking Stats Endpoint')
  console.log('==================================')

  // Test basic stats request
  const statsResponse = await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: userIds,
    },
    'Get booking stats for multiple users',
  )

  if (statsResponse?.stats) {
    console.log(`\n📈 Booking Stats Summary:`)
    statsResponse.stats.forEach((stat: any) => {
      console.log(`\n   User: ${stat.userId}`)
      console.log(`   Total Bookings: ${stat.totalBookings}`)
      console.log(`   Completed: ${stat.completedBookings}`)
      console.log(`   Cancelled: ${stat.cancelledBookings}`)
      console.log(`   Declined: ${stat.declinedBookings}`)
      console.log(`   Upcoming: ${stat.upcomingBookings}`)
      console.log(`   Total Spent: $${(stat.totalSpent / 100).toFixed(2)}`)

      if (stat.lastBookingDate) {
        console.log(
          `   Last Booking: ${stat.lastBookingDate} (${stat.lastBookingStatus})`,
        )
        console.log(`   Last Booking ID: ${stat.lastBookingId}`)
        console.log(`   Last Booking Gym: ${stat.lastBookingGymId}`)
      } else {
        console.log(`   Last Booking: None`)
      }
    })
  }

  // Test 3: Test with date filtering
  console.log('\n📅 Testing Date Range Filtering')
  console.log('================================')

  const fromDate = new Date('2024-01-01').toISOString()
  const toDate = new Date().toISOString()

  const dateFilteredStats = await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: userIds,
      fromDate: fromDate,
      toDate: toDate,
    },
    `Filter stats from ${fromDate.split('T')[0]} to ${toDate.split('T')[0]}`,
  )

  if (dateFilteredStats?.stats) {
    console.log(`\n📈 Date Filtered Stats Summary:`)
    dateFilteredStats.stats.forEach((stat: any) => {
      console.log(
        `   User ${stat.userId}: ${stat.totalBookings} bookings in date range`,
      )
    })
  }

  // Test 4: Test with a single user
  console.log('\n👤 Testing Single User Stats')
  console.log('=============================')

  const singleUserStats = await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: [userIds[0]],
    },
    'Get booking stats for single user',
  )

  // Test 5: Test validation errors
  console.log('\n⚠️  Testing Validation Errors')
  console.log('==============================')

  // Test empty user IDs
  await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: [],
    },
    'Test validation with empty user IDs array (should fail)',
  )

  // Test too many user IDs (create 101 fake UUIDs)
  const tooManyIds = Array(101)
    .fill(0)
    .map(() => 'f47ac10b-58cc-4372-a567-0e02b2c3d479')

  await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: tooManyIds,
    },
    'Test validation with too many user IDs (should fail)',
  )

  // Test 6: Test with non-existent users
  console.log('\n🔍 Testing Non-Existent Users')
  console.log('==============================')

  const fakeUserIds = [
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  ]

  const fakeUserStats = await testRoute(
    'POST',
    '/admin/sessions/stats/bookings',
    token,
    {
      userIds: fakeUserIds,
    },
    'Get stats for non-existent users (should return zero stats)',
  )

  if (fakeUserStats?.stats) {
    console.log(`\n📊 Non-existent User Stats:`)
    fakeUserStats.stats.forEach((stat: any) => {
      console.log(
        `   User ${stat.userId}: ${stat.totalBookings} bookings (should be 0)`,
      )
    })
  }

  console.log('\n✅ Booking stats test completed!')
}

// Run the script
main().catch(console.error)
