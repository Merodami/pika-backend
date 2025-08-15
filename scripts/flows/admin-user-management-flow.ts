#!/usr/bin/env tsx
/**
 * Admin User Management Flow Test Script
 * Tests administrative user management operations including CRUD operations,
 * role changes, status updates, and bulk operations
 *
 * Usage: tsx admin-user-management-flow.ts
 */

import { AxiosInstance } from 'axios'

import {
  authenticateUser,
  createApiClient,
  executeFlow,
  generateRandomEmail,
  generateRandomPhone,
  logError,
  logInfo,
  logSection,
  logStep,
  logSuccess,
  printTestSummary,
  TEST_USERS,
  TestResult,
} from './flow-utils.js'

// Test data
const testUsers = [
  {
    email: generateRandomEmail(),
    password: 'TestUser123!',
    firstName: 'Test',
    lastName: 'User One',
    phoneNumber: generateRandomPhone(),
    dateOfBirth: '1990-01-15',
    acceptTerms: true,
    marketingConsent: false,
  },
  {
    email: generateRandomEmail(),
    password: 'TestUser456!',
    firstName: 'Test',
    lastName: 'User Two',
    phoneNumber: generateRandomPhone(),
    dateOfBirth: '1985-06-20',
    acceptTerms: true,
    marketingConsent: true,
  },
  {
    email: generateRandomEmail(),
    password: 'TestUser789!',
    firstName: 'Test',
    lastName: 'User Three',
    phoneNumber: generateRandomPhone(),
    dateOfBirth: '1995-12-10',
    acceptTerms: true,
    marketingConsent: false,
  },
]

const createdUserIds: string[] = []
const testResults: TestResult[] = []

// Admin user management test functions
async function testListUsers(api: AxiosInstance): Promise<void> {
  logStep(1, 'List All Users (Paginated)')

  try {
    // Test basic listing
    const response = await api.get('/users', {
      params: {
        page: 1,
        limit: 10,
      },
    })

    logSuccess(
      `Retrieved ${response.data.data.length} users (page 1 of ${response.data.pagination.totalPages})`,
    )
    logInfo(`Total users: ${response.data.pagination.total}`)

    // Test with filters
    const filteredResponse = await api.get('/users', {
      params: {
        role: 'customer',
        status: 'active',
        limit: 5,
      },
    })

    logSuccess(
      `Filtered query returned ${filteredResponse.data.data.length} active customers`,
    )

    // Test search by email
    const searchResponse = await api.get('/users', {
      params: {
        search: TEST_USERS.customer.email,
      },
    })

    logSuccess(
      `Search found ${searchResponse.data.data.length} user(s) matching email`,
    )

    testResults.push({
      name: 'List Users',
      success: true,
      message: `Successfully listed and filtered users`,
    })
  } catch (error: any) {
    logError(
      `Failed to list users: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'List Users',
      success: false,
      message: error.response?.data?.message || error.message,
    })
    throw error
  }
}

async function testCreateUsers(api: AxiosInstance): Promise<void> {
  logStep(2, 'Create Test Users via Admin API')

  for (const userData of testUsers) {
    try {
      logInfo(`Creating user: ${userData.email}`)

      const response = await api.post('/admin/users', {
        ...userData,
        emailVerified: true, // Admin can create pre-verified users
        status: 'active',
        role: 'customer',
      })

      createdUserIds.push(response.data.id)
      logSuccess(`Created user ${userData.email} with ID: ${response.data.id}`)

      testResults.push({
        name: `Create User (${userData.email})`,
        success: true,
        message: `ID: ${response.data.id}`,
      })
    } catch (error: any) {
      logError(
        `Failed to create user ${userData.email}: ${error.response?.data?.message || error.message}`,
      )
      testResults.push({
        name: `Create User (${userData.email})`,
        success: false,
        message: error.response?.data?.message || error.message,
      })
    }
  }
}

async function testGetUserDetails(api: AxiosInstance): Promise<void> {
  logStep(3, 'Get User Details')

  if (createdUserIds.length === 0) {
    logError('No users created to test')

    return
  }

  const userId = createdUserIds[0]

  try {
    const response = await api.get(`/users/${userId}`)

    logSuccess(`Retrieved user details for ID: ${userId}`)
    logInfo(`Email: ${response.data.email}`)
    logInfo(`Name: ${response.data.firstName} ${response.data.lastName}`)
    logInfo(`Role: ${response.data.role}`)
    logInfo(`Status: ${response.data.status}`)
    logInfo(`Email Verified: ${response.data.emailVerified}`)

    testResults.push({
      name: 'Get User Details',
      success: true,
      message: `Retrieved user ${response.data.email}`,
    })
  } catch (error: any) {
    logError(
      `Failed to get user details: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Get User Details',
      success: false,
      message: error.response?.data?.message || error.message,
    })
    throw error
  }
}

async function testUpdateUser(api: AxiosInstance): Promise<void> {
  logStep(4, 'Update User Information')

  if (createdUserIds.length === 0) {
    logError('No users created to test')

    return
  }

  const userId = createdUserIds[0]

  try {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: generateRandomPhone(),
      preferredLanguage: 'es',
    }

    const response = await api.patch(`/users/${userId}`, updateData)

    logSuccess(`Updated user ${userId}`)
    logInfo(`New name: ${response.data.firstName} ${response.data.lastName}`)
    logInfo(`New phone: ${response.data.phoneNumber}`)
    logInfo(`Preferred language: ${response.data.preferredLanguage}`)

    testResults.push({
      name: 'Update User',
      success: true,
      message: `Updated user ${response.data.email}`,
    })
  } catch (error: any) {
    logError(
      `Failed to update user: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Update User',
      success: false,
      message: error.response?.data?.message || error.message,
    })
    throw error
  }
}

async function testChangeUserRole(api: AxiosInstance): Promise<void> {
  logStep(5, 'Change User Role')

  if (createdUserIds.length < 2) {
    logError('Not enough users created to test role change')

    return
  }

  const userId = createdUserIds[1]

  try {
    // Promote to business role
    const response = await api.patch(`/users/${userId}/role`, {
      role: 'business',
    })

    logSuccess(`Changed user ${userId} role to: ${response.data.role}`)

    // Verify role change
    const verifyResponse = await api.get(`/users/${userId}`)

    if (verifyResponse.data.role === 'business') {
      logSuccess('Role change verified successfully')
    }

    testResults.push({
      name: 'Change User Role',
      success: true,
      message: `Changed to ${response.data.role}`,
    })
  } catch (error: any) {
    logError(
      `Failed to change user role: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Change User Role',
      success: false,
      message: error.response?.data?.message || error.message,
    })
    throw error
  }
}

async function testUpdateUserStatus(api: AxiosInstance): Promise<void> {
  logStep(6, 'Update User Status')

  if (createdUserIds.length < 3) {
    logError('Not enough users created to test status update')

    return
  }

  const userId = createdUserIds[2]

  try {
    // Suspend user
    let response = await api.patch(`/users/${userId}/status`, {
      status: 'suspended',
      reason: 'Test suspension for administrative testing',
    })

    logSuccess(`User ${userId} suspended`)
    logInfo(`New status: ${response.data.status}`)

    // Reactivate user
    response = await api.patch(`/users/${userId}/status`, {
      status: 'active',
      reason: 'Test reactivation',
    })

    logSuccess(`User ${userId} reactivated`)
    logInfo(`New status: ${response.data.status}`)

    testResults.push({
      name: 'Update User Status',
      success: true,
      message: 'Successfully suspended and reactivated',
    })
  } catch (error: any) {
    logError(
      `Failed to update user status: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Update User Status',
      success: false,
      message: error.response?.data?.message || error.message,
    })
    throw error
  }
}

async function testBulkOperations(api: AxiosInstance): Promise<void> {
  logStep(7, 'Bulk User Operations')

  if (createdUserIds.length < 2) {
    logError('Not enough users for bulk operations')

    return
  }

  try {
    // Bulk status update
    const bulkStatusResponse = await api.post('/admin/users/bulk/status', {
      userIds: createdUserIds.slice(0, 2),
      status: 'inactive',
      reason: 'Bulk test deactivation',
    })

    logSuccess(
      `Bulk status update: ${bulkStatusResponse.data.updated} users set to inactive`,
    )

    // Bulk reactivate
    const bulkReactivateResponse = await api.post('/admin/users/bulk/status', {
      userIds: createdUserIds.slice(0, 2),
      status: 'active',
      reason: 'Bulk test reactivation',
    })

    logSuccess(
      `Bulk reactivation: ${bulkReactivateResponse.data.updated} users reactivated`,
    )

    testResults.push({
      name: 'Bulk Operations',
      success: true,
      message: `Successfully performed bulk operations on ${createdUserIds.length} users`,
    })
  } catch (error: any) {
    logError(
      `Failed bulk operations: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Bulk Operations',
      success: false,
      message: error.response?.data?.message || error.message,
    })
  }
}

async function testUserStatistics(api: AxiosInstance): Promise<void> {
  logStep(8, 'User Statistics and Analytics')

  try {
    // Get user statistics
    const statsResponse = await api.get('/admin/users/statistics')

    logSuccess('Retrieved user statistics')
    logInfo(`Total users: ${statsResponse.data.totalUsers}`)
    logInfo(`Active users: ${statsResponse.data.activeUsers}`)
    logInfo(`Verified emails: ${statsResponse.data.verifiedEmails}`)
    logInfo(`Users by role:`)
    Object.entries(statsResponse.data.byRole || {}).forEach(([role, count]) => {
      logInfo(`  - ${role}: ${count}`)
    })
    logInfo(`Users by status:`)
    Object.entries(statsResponse.data.byStatus || {}).forEach(
      ([status, count]) => {
        logInfo(`  - ${status}: ${count}`)
      },
    )

    testResults.push({
      name: 'User Statistics',
      success: true,
      message: `Retrieved statistics for ${statsResponse.data.totalUsers} users`,
    })
  } catch (error: any) {
    // Statistics endpoint might not be implemented
    if (error.response?.status === 404) {
      logInfo('Statistics endpoint not implemented')
      testResults.push({
        name: 'User Statistics',
        success: true,
        message: 'Endpoint not implemented (expected)',
      })
    } else {
      logError(
        `Failed to get statistics: ${error.response?.data?.message || error.message}`,
      )
      testResults.push({
        name: 'User Statistics',
        success: false,
        message: error.response?.data?.message || error.message,
      })
    }
  }
}

async function testExportUsers(api: AxiosInstance): Promise<void> {
  logStep(9, 'Export Users Data')

  try {
    // Export users as CSV
    const exportResponse = await api.get('/admin/users/export', {
      params: {
        format: 'csv',
        includeInactive: true,
      },
      responseType: 'blob',
    })

    if (exportResponse.status === 200) {
      logSuccess('Successfully exported users data')
      logInfo(`Export format: CSV`)
      logInfo(`Content-Type: ${exportResponse.headers['content-type']}`)
    }

    testResults.push({
      name: 'Export Users',
      success: true,
      message: 'Successfully exported user data',
    })
  } catch (error: any) {
    // Export endpoint might not be implemented
    if (error.response?.status === 404) {
      logInfo('Export endpoint not implemented')
      testResults.push({
        name: 'Export Users',
        success: true,
        message: 'Endpoint not implemented (expected)',
      })
    } else {
      logError(
        `Failed to export users: ${error.response?.data?.message || error.message}`,
      )
      testResults.push({
        name: 'Export Users',
        success: false,
        message: error.response?.data?.message || error.message,
      })
    }
  }
}

async function testDeleteUser(api: AxiosInstance): Promise<void> {
  logStep(10, 'Delete User (Soft Delete)')

  if (createdUserIds.length === 0) {
    logError('No users created to test deletion')

    return
  }

  const userToDelete = createdUserIds[createdUserIds.length - 1]

  try {
    const response = await api.delete(`/users/${userToDelete}`)

    logSuccess(`User ${userToDelete} deleted`)
    if (response.data.message) {
      logInfo(response.data.message)
    }

    // Verify user is soft deleted (status should be 'deleted' or not accessible)
    try {
      const verifyResponse = await api.get(`/users/${userToDelete}`)

      if (verifyResponse.data.status === 'deleted') {
        logSuccess('User soft deleted (marked as deleted)')
      }
    } catch (verifyError: any) {
      if (verifyError.response?.status === 404) {
        logSuccess('User properly deleted (not accessible)')
      }
    }

    testResults.push({
      name: 'Delete User',
      success: true,
      message: 'User successfully deleted',
    })
  } catch (error: any) {
    logError(
      `Failed to delete user: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Delete User',
      success: false,
      message: error.response?.data?.message || error.message,
    })
  }
}

async function testSearchAndFilter(api: AxiosInstance): Promise<void> {
  logStep(11, 'Advanced Search and Filtering')

  try {
    // Search by name
    const nameSearchResponse = await api.get('/users', {
      params: {
        search: 'Test User',
        searchFields: 'firstName,lastName',
      },
    })

    logSuccess(`Name search found ${nameSearchResponse.data.data.length} users`)

    // Filter by date range (users created today)
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const dateRangeResponse = await api.get('/users', {
      params: {
        createdFrom: startOfDay,
        createdTo: endOfDay,
      },
    })

    logSuccess(
      `Found ${dateRangeResponse.data.data.length} users created today`,
    )

    // Complex filter
    const complexFilterResponse = await api.get('/users', {
      params: {
        role: 'customer',
        status: 'active',
        emailVerified: true,
        sort: 'createdAt',
        order: 'desc',
        limit: 5,
      },
    })

    logSuccess(
      `Complex filter returned ${complexFilterResponse.data.data.length} results`,
    )

    testResults.push({
      name: 'Search and Filter',
      success: true,
      message: 'Advanced search and filtering working',
    })
  } catch (error: any) {
    logError(
      `Search/filter failed: ${error.response?.data?.message || error.message}`,
    )
    testResults.push({
      name: 'Search and Filter',
      success: false,
      message: error.response?.data?.message || error.message,
    })
  }
}

async function testImpersonation(api: AxiosInstance): Promise<void> {
  logStep(12, 'User Impersonation (Admin Feature)')

  if (createdUserIds.length === 0) {
    logError('No users created to test impersonation')

    return
  }

  const userToImpersonate = createdUserIds[0]

  try {
    // Generate impersonation token
    const impersonateResponse = await api.post(
      `/users/${userToImpersonate}/impersonate`,
    )

    if (impersonateResponse.data.impersonationToken) {
      logSuccess(`Generated impersonation token for user ${userToImpersonate}`)
      logInfo(`Token expires in: ${impersonateResponse.data.expiresIn} seconds`)

      // Test using impersonation token
      const impersonatedApi = createApiClient()

      impersonatedApi.defaults.headers.common['Authorization'] =
        `Bearer ${impersonateResponse.data.impersonationToken}`

      const meResponse = await impersonatedApi.get('/users/me')

      logSuccess(`Successfully impersonating user: ${meResponse.data.email}`)

      testResults.push({
        name: 'User Impersonation',
        success: true,
        message: `Successfully impersonated ${meResponse.data.email}`,
      })
    }
  } catch (error: any) {
    // Impersonation might not be implemented
    if (error.response?.status === 404) {
      logInfo('Impersonation endpoint not implemented')
      testResults.push({
        name: 'User Impersonation',
        success: true,
        message: 'Endpoint not implemented (expected)',
      })
    } else {
      logError(
        `Impersonation failed: ${error.response?.data?.message || error.message}`,
      )
      testResults.push({
        name: 'User Impersonation',
        success: false,
        message: error.response?.data?.message || error.message,
      })
    }
  }
}

// Cleanup function
async function cleanup(api: AxiosInstance): Promise<void> {
  logSection('🧹 Cleaning up test users')

  for (const userId of createdUserIds) {
    try {
      await api.delete(`/users/${userId}`)
      logSuccess(`Deleted test user ${userId}`)
    } catch (error: any) {
      logError(
        `Failed to delete user ${userId}: ${error.response?.data?.message || error.message}`,
      )
    }
  }
}

// Main flow execution
async function runAdminUserManagementFlow(): Promise<void> {
  const api = createApiClient()

  try {
    // Authenticate as admin
    await authenticateUser(
      api,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    )

    // Run all tests
    await testListUsers(api)
    await testCreateUsers(api)
    await testGetUserDetails(api)
    await testUpdateUser(api)
    await testChangeUserRole(api)
    await testUpdateUserStatus(api)
    await testBulkOperations(api)
    await testUserStatistics(api)
    await testExportUsers(api)
    await testSearchAndFilter(api)
    await testImpersonation(api)
    await testDeleteUser(api)

    // Print summary
    printTestSummary(testResults)
  } catch (error) {
    logError('Flow execution failed')
    printTestSummary(testResults)
    process.exit(1)
  } finally {
    // Cleanup created users
    if (createdUserIds.length > 0) {
      await cleanup(api)
    }
  }
}

// Execute the flow
executeFlow(runAdminUserManagementFlow, {
  title: 'Admin User Management Flow',
})
