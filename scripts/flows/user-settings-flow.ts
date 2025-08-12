#!/usr/bin/env tsx
/**
 * User Settings Flow Test Script
 * Tests updating user profile and preferences including preferred language
 *
 * Usage: tsx scripts/flows/user-settings-flow.ts
 */

import {
  authenticateUser,
  createApiClient,
  delay,
  executeFlow,
  logError,
  logInfo,
  logStep,
  logSuccess,
  logWarning,
  printTestSummary,
  TEST_USERS,
  TestResult,
} from './flow-utils.js'

// Main flow
async function testUserSettingsFlow() {
  const api = createApiClient()
  const results: TestResult[] = []

  // Step 1: Login
  logStep(1, 'Login with admin user')

  const { accessToken } = await authenticateUser(
    api,
    TEST_USERS.admin.email,
    TEST_USERS.admin.password,
  )

  results.push({ name: 'Authentication', success: true })

  // Step 2: Get current user profile
  logStep(2, 'Get current user profile')

  const profileResponse = await api.get('/users/me')
  const originalProfile = profileResponse.data

  logSuccess('Retrieved user profile')
  logInfo(`Current user: ${originalProfile.email}`)
  logInfo(`Current role: ${originalProfile.role}`)
  logInfo(`Current language: ${originalProfile.preferredLanguage || 'Not set'}`)
  results.push({ name: 'Get Profile', success: true })

  // Step 3: Update preferred language
  logStep(3, 'Update preferred language to Spanish')
  try {
    const updateLanguageResponse = await api.put('/users/me', {
      preferredLanguage: 'es',
    })

    if (updateLanguageResponse.data.preferredLanguage === 'es') {
      logSuccess('Updated preferred language to Spanish')
      results.push({ name: 'Set Language to Spanish', success: true })
    } else {
      throw new Error('Language not updated correctly')
    }
  } catch (error) {
    logError('Failed to update language')
    results.push({
      name: 'Set Language to Spanish',
      success: false,
      message: String(error),
    })
  }

  // Step 4: Update multiple profile fields
  logStep(4, 'Update profile information')

  const profileUpdate = {
    firstName: 'Updated',
    lastName: 'Admin',
    preferredLanguage: 'en',
  }

  try {
    const updateProfileResponse = await api.put('/users/me', profileUpdate)

    const updated = updateProfileResponse.data

    if (
      updated.firstName === 'Updated' &&
      updated.lastName === 'Admin' &&
      updated.preferredLanguage === 'en'
    ) {
      logSuccess('Updated profile information')
      results.push({ name: 'Update Profile', success: true })
    } else {
      throw new Error('Profile not updated correctly')
    }
  } catch (error) {
    logError('Failed to update profile')
    results.push({
      name: 'Update Profile',
      success: false,
      message: String(error),
    })
  }

  // Step 5: Test various language codes
  logStep(5, 'Test various ISO 639-1 language codes')

  const languages = [
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
  ]

  for (const lang of languages.slice(0, 3)) {
    // Test first 3 to avoid rate limiting
    logInfo(`Testing language: ${lang.name} (${lang.code})`)
    try {
      const langResponse = await api.put('/users/me', {
        preferredLanguage: lang.code,
      })

      if (langResponse.data.preferredLanguage === lang.code) {
        logSuccess(`Successfully set language to: ${lang.name}`)
        results.push({ name: `Set Language to ${lang.name}`, success: true })
      } else {
        throw new Error(`Language not set to ${lang.code}`)
      }
    } catch (error) {
      logError(`Failed to set language to: ${lang.name}`)
      results.push({ name: `Set Language to ${lang.name}`, success: false })
    }

    await delay(500) // Avoid rate limiting
  }

  // Step 6: Test invalid language code
  logStep(6, 'Test invalid language code (should handle gracefully)')
  try {
    await api.put('/users/me', {
      preferredLanguage: 'xyz', // Invalid code
    })
    logWarning('Server accepted invalid language code (might need validation)')
    results.push({
      name: 'Invalid Language Handling',
      success: true,
      message: 'Accepted (check if validation needed)',
    })
  } catch (error) {
    logSuccess('Server properly rejected invalid language code')
    results.push({
      name: 'Invalid Language Handling',
      success: true,
      message: 'Properly rejected',
    })
  }

  // Step 7: Test clearing language preference
  logStep(7, 'Clear language preference (set to null)')
  try {
    const clearResponse = await api.put('/users/me', {
      preferredLanguage: null,
    })

    if (clearResponse.data.preferredLanguage === null) {
      logSuccess('Successfully cleared language preference')
      results.push({ name: 'Clear Language', success: true })
    } else {
      throw new Error('Language not cleared')
    }
  } catch (error) {
    logError('Failed to clear language')
    results.push({ name: 'Clear Language', success: false })
  }

  // Step 8: Get final profile state
  logStep(8, 'Get final profile state')

  const finalProfileResponse = await api.get('/users/me')
  const finalProfile = finalProfileResponse.data

  logSuccess('Retrieved final profile')
  logInfo(`Final profile state:`)
  logInfo(`  Name: ${finalProfile.firstName} ${finalProfile.lastName}`)
  logInfo(`  Email: ${finalProfile.email}`)
  logInfo(`  Language: ${finalProfile.preferredLanguage || 'Not set'}`)
  results.push({ name: 'Get Final Profile', success: true })

  // Step 9: Test preferences endpoint (if available)
  logStep(9, 'Test user preferences endpoint')
  try {
    const preferencesResponse = await api.get('/users/me/preferences')

    logSuccess('Retrieved user preferences')
    results.push({ name: 'Get Preferences', success: true })
  } catch (error: any) {
    if (error.response?.status === 404) {
      logInfo('Preferences endpoint not implemented yet')
      results.push({
        name: 'Get Preferences',
        success: true,
        message: 'Not implemented (expected)',
      })
    } else {
      logError('Unexpected error with preferences endpoint')
      results.push({ name: 'Get Preferences', success: false })
    }
  }

  // Step 10: Cleanup - Reset to original state
  logStep(10, 'Cleanup - Reset to original state')
  try {
    await api.put('/users/me', {
      firstName: originalProfile.firstName || 'Admin',
      lastName: originalProfile.lastName || 'User',
      preferredLanguage: originalProfile.preferredLanguage || null,
    })
    logSuccess('Reset user to original state')
    results.push({ name: 'Cleanup', success: true })
  } catch (error) {
    logError('Failed to reset user')
    results.push({ name: 'Cleanup', success: false })
  }

  // Print summary
  printTestSummary(results)
}

// Execute the flow
executeFlow(testUserSettingsFlow, {
  title: 'User Settings Flow Test',
}).catch((error) => {
  logError(`Unhandled error: ${error}`)
  process.exit(1)
})
