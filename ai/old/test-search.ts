#!/usr/bin/env tsx

import axios from 'axios'

const API_BASE_URL = 'http://localhost:5500/api/v1'

// Admin user credentials
const adminCredentials = {
  email: 'admin@solo60.com',
  password: 'Admin123!',
}

async function getAdminToken(): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token`, {
      grantType: 'password',
      username: adminCredentials.email,
      password: adminCredentials.password,
    })

    return response.data.accessToken
  } catch (error: any) {
    console.error(
      '❌ Failed to get token:',
      error.response?.data || error.message,
    )
    process.exit(1)
  }
}

async function testSearch(token: string) {
  console.log('🔍 Testing User Search Functionality')
  console.log('=====================================\n')

  // Test 1: Search by name "Zoila"
  try {
    console.log('📍 Test 1: Searching for "Zoila"')

    const response = await axios.get(`${API_BASE_URL}/users`, {
      params: {
        page: 1,
        limit: 10,
        search: 'Zoila',
        sortBy: 'CREATED_AT',
        sortOrder: 'DESC',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(`✅ Found ${response.data.data.length} users`)
    response.data.data.forEach((user: any) => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`)
    })
  } catch (error: any) {
    console.error('❌ Search failed:', error.response?.data || error.message)
  }

  // Test 2: Search by partial name
  console.log('\n📍 Test 2: Testing partial name search')

  const searchTerms = ['Test', 'Admin', 'Member', 'Zoi']

  for (const term of searchTerms) {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: {
          page: 1,
          limit: 5,
          search: term,
          sortBy: 'CREATED_AT',
          sortOrder: 'DESC',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`\n   Search term: "${term}"`)
      console.log(`   Found: ${response.data.data.length} users`)
      response.data.data.forEach((user: any) => {
        console.log(`     - ${user.firstName} ${user.lastName} (${user.email})`)
      })
    } catch (error: any) {
      console.error(
        `   ❌ Failed to search for "${term}":`,
        error.response?.status,
      )
    }
  }

  // Test 3: Search by email
  console.log('\n📍 Test 3: Testing email search')
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      params: {
        page: 1,
        limit: 5,
        search: 'solo60.com',
        sortBy: 'CREATED_AT',
        sortOrder: 'DESC',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(
      `   Found ${response.data.data.length} users with "solo60.com" in email`,
    )
    response.data.data.forEach((user: any) => {
      console.log(`     - ${user.email} (${user.firstName} ${user.lastName})`)
    })
  } catch (error: any) {
    console.error(
      '❌ Email search failed:',
      error.response?.data || error.message,
    )
  }

  // Test 4: Check search parameter details
  console.log('\n📍 Test 4: Understanding search parameter')
  console.log('   According to AdminUserQueryParams schema:')
  console.log('   - search: string (optional) - Search in name, email, phone')
  console.log('   - This means the search should look in:')
  console.log('     • firstName')
  console.log('     • lastName')
  console.log('     • email')
  console.log('     • phoneNumber')
}

async function main() {
  console.log('🚀 Solo60 User Search Test')
  console.log('==========================\n')

  const token = await getAdminToken()

  await testSearch(token)

  console.log('\n✅ Search test completed!')
}

main().catch(console.error)
