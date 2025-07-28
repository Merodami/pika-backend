#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios'
import { ADMIN_USER, createAdminUser } from './admin-setup.js'

// API Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:5500'
const API_PREFIX = '/api/v1'

// Test data
const testAdmin = ADMIN_USER

const testCustomer = {
  email: `customer-${Date.now()}@example.com`,
  password: 'CustomerPassword123!',
  firstName: 'Test',
  lastName: 'Customer',
  phoneNumber: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
  dateOfBirth: '1990-01-01',
  acceptTerms: true,
  marketingConsent: false,
}

const testCategories = [
  {
    nameKey: 'category.fitness',
    descriptionKey: 'category.fitness.description',
    icon: 'fitness',
    isActive: true,
    sortOrder: 1,
  },
  {
    nameKey: 'category.wellness',
    descriptionKey: 'category.wellness.description',
    icon: 'wellness',
    isActive: true,
    sortOrder: 2,
  },
  {
    nameKey: 'category.sports',
    descriptionKey: 'category.sports.description',
    icon: 'sports',
    isActive: true,
    sortOrder: 3,
  },
]

// Subcategories
const testSubcategories = [
  {
    nameKey: 'category.fitness.gym',
    descriptionKey: 'category.fitness.gym.description',
    icon: 'gym',
    isActive: true,
    sortOrder: 1,
    // parentId will be set dynamically
  },
  {
    nameKey: 'category.fitness.yoga',
    descriptionKey: 'category.fitness.yoga.description',
    icon: 'yoga',
    isActive: true,
    sortOrder: 2,
    // parentId will be set dynamically
  },
]

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
    log(`${colors.dim}Request body: ${JSON.stringify(data, null, 2)}${colors.reset}`)
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
    log(`${colors.dim}${JSON.stringify(error.response?.data, null, 2)}${colors.reset}`)
    if (duration) {
      log(`${colors.dim}⏱️  Duration: ${duration}ms${colors.reset}`)
    }
    return Promise.reject(error)
  }
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
    logError(`Admin login failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function registerAndLoginCustomer(): Promise<string> {
  logInfo('Registering new customer...')
  
  try {
    // Register
    await api.post('/auth/register', testCustomer)
    logInfo('Customer registered (email verification pending)')
    
    // Note: In real scenario, email verification would be required
    // For testing, we'll attempt login anyway
    try {
      const response = await api.post('/auth/token', {
        grantType: 'password',
        username: testCustomer.email,
        password: testCustomer.password,
      })
      return response.data.accessToken
    } catch (loginError: any) {
      logInfo('Login blocked - email verification required (expected behavior)')
      // For demo purposes, return empty token
      return ''
    }
  } catch (error: any) {
    logError(`Customer registration failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

// Category management functions (Admin)
async function createCategory(token: string, categoryData: any): Promise<string> {
  logRequest('POST', '/categories/admin/categories', categoryData)
  
  try {
    const response = await api.post('/categories/admin/categories', categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    logSuccess(`Category created: ${response.data.id}`)
    return response.data.id
  } catch (error: any) {
    logError(`Category creation failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function updateCategory(token: string, categoryId: string, updateData: any): Promise<void> {
  logRequest('PUT', `/categories/admin/categories/${categoryId}`, updateData)
  
  try {
    await api.put(`/categories/admin/categories/${categoryId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    logSuccess('Category updated successfully')
  } catch (error: any) {
    logError(`Category update failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function toggleCategoryActivation(token: string, categoryId: string, isActive: boolean): Promise<void> {
  logRequest('PUT', `/categories/admin/categories/${categoryId}/activation`, { isActive })
  
  try {
    await api.put(`/categories/admin/categories/${categoryId}/activation`, { isActive }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    logSuccess(`Category ${isActive ? 'activated' : 'deactivated'} successfully`)
  } catch (error: any) {
    logError(`Category activation toggle failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function deleteCategory(token: string, categoryId: string): Promise<void> {
  logRequest('DELETE', `/categories/admin/categories/${categoryId}`)
  
  try {
    await api.delete(`/categories/admin/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    logSuccess('Category deleted successfully')
  } catch (error: any) {
    logError(`Category deletion failed: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

// Category browsing functions (Public)
async function listPublicCategories(token?: string): Promise<void> {
  logRequest('GET', '/categories')
  
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await api.get('/categories', { headers })
    
    logSuccess(`Found ${response.data.data.length} categories`)
    logInfo(`Total categories: ${response.data.pagination.total}`)
  } catch (error: any) {
    logError(`Failed to list categories: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function getCategoryHierarchy(): Promise<void> {
  logRequest('GET', '/categories/hierarchy')
  
  try {
    const response = await api.get('/categories/hierarchy')
    
    logSuccess(`Retrieved category hierarchy with ${response.data.data.length} root categories`)
  } catch (error: any) {
    logError(`Failed to get category hierarchy: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function getCategoryPath(categoryId: string): Promise<void> {
  logRequest('GET', `/categories/${categoryId}/path`)
  
  try {
    const response = await api.get(`/categories/${categoryId}/path`)
    
    logSuccess(`Retrieved category path with ${response.data.data.length} levels`)
  } catch (error: any) {
    logError(`Failed to get category path: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

// Main flow
async function runCategoryFlow() {
  log(`\n${colors.bright}🚀 Starting Category Management Flow${colors.reset}`)
  log(`API Gateway URL: ${API_GATEWAY_URL}`)
  
  let adminToken: string = ''
  let customerToken: string = ''
  const createdCategoryIds: string[] = []
  
  try {
    // Ensure admin user exists
    log(`\n${colors.bright}=== Setup: Ensuring Admin User ===${colors.reset}`)
    await createAdminUser()
    // Phase 1: Admin Category Management
    log(`\n${colors.bright}=== Phase 1: Admin Category Management ===${colors.reset}`)
    
    logStep(1, 'Admin Authentication')
    adminToken = await loginAsAdmin()
    
    logStep(2, 'Create Parent Categories')
    for (const category of testCategories) {
      const categoryId = await createCategory(adminToken, category)
      createdCategoryIds.push(categoryId)
      
      // Create subcategories for the first category
      if (createdCategoryIds.length === 1) {
        logInfo('Creating subcategories...')
        for (const subcategory of testSubcategories) {
          const subcategoryData = { ...subcategory, parentId: categoryId }
          const subcategoryId = await createCategory(adminToken, subcategoryData)
          createdCategoryIds.push(subcategoryId)
        }
      }
    }
    
    logStep(3, 'Update Category')
    if (createdCategoryIds.length > 0) {
      await updateCategory(adminToken, createdCategoryIds[0], {
        descriptionKey: 'category.fitness.updated.description',
        sortOrder: 10,
      })
    }
    
    logStep(4, 'Toggle Category Activation')
    if (createdCategoryIds.length > 1) {
      await toggleCategoryActivation(adminToken, createdCategoryIds[1], false)
    }
    
    // Phase 2: Public Category Browsing
    log(`\n${colors.bright}=== Phase 2: Public Category Browsing ===${colors.reset}`)
    
    logStep(5, 'Public Category List (Anonymous)')
    await listPublicCategories()
    
    logStep(6, 'Customer Registration & Category Browsing')
    customerToken = await registerAndLoginCustomer()
    
    logStep(7, 'Category Hierarchy')
    await getCategoryHierarchy()
    
    logStep(8, 'Category Path')
    if (createdCategoryIds.length > 3) {
      // Get path for a subcategory
      await getCategoryPath(createdCategoryIds[3])
    }
    
    // Phase 3: Cleanup
    log(`\n${colors.bright}=== Phase 3: Cleanup ===${colors.reset}`)
    
    logStep(9, 'Delete Test Categories')
    // Delete in reverse order (children first)
    for (let i = createdCategoryIds.length - 1; i >= 0; i--) {
      try {
        await deleteCategory(adminToken, createdCategoryIds[i])
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    log(`\n${colors.bright}${colors.green}✅ Category Flow Completed Successfully!${colors.reset}`)
    log(`\nFlow Summary:`)
    log(`- Created ${createdCategoryIds.length} categories (parent and child)`)
    log(`- Demonstrated admin CRUD operations`)
    log(`- Showed public browsing capabilities`)
    log(`- Tested hierarchical structure`)
    
  } catch (error: any) {
    log(`\n${colors.bright}${colors.red}❌ Category Flow Failed!${colors.reset}`)
    if (error.response) {
      log(`\nError details:`)
      log(`Status: ${error.response.status}`)
      log(`Message: ${error.response.data?.message || error.message}`)
    } else {
      log(`\nError: ${error.message}`)
    }
    process.exit(1)
  }
}

// Run the flow
runCategoryFlow().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})