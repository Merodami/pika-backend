#!/usr/bin/env node
import { ZodRegistry } from '../common/registry/base.js'
import { registerAdminAPI } from './generators/admin-api.js'
import { registerPublicAPI } from './generators/public-api.js'
import { registerInternalAPI } from './generators/internal-api.js'

// Test each generator separately
async function testGenerators() {
  console.log('Testing Admin API...')
  try {
    const adminRegistry = new ZodRegistry({
      title: 'Admin API Test',
      version: '1.0.0',
    })
    registerAdminAPI(adminRegistry)
    console.log('✓ Admin API registered successfully')
  } catch (error) {
    console.error('✗ Admin API failed:', error.message)
    console.error(error.stack)
  }

  console.log('\nTesting Public API...')
  try {
    const publicRegistry = new ZodRegistry({
      title: 'Public API Test',
      version: '1.0.0',
    })
    registerPublicAPI(publicRegistry)
    console.log('✓ Public API registered successfully')
    
    // Try to generate document
    console.log('  Generating Public API document...')
    const publicDoc = publicRegistry.generateDocument()
    console.log('  ✓ Public API document generated successfully')
  } catch (error) {
    console.error('✗ Public API failed:', error.message)
    console.error(error.stack)
  }

  console.log('\nTesting Internal API...')
  try {
    const internalRegistry = new ZodRegistry({
      title: 'Internal API Test',
      version: '1.0.0',
    })
    registerInternalAPI(internalRegistry)
    console.log('✓ Internal API registered successfully')
  } catch (error) {
    console.error('✗ Internal API failed:', error.message)
    console.error(error.stack)
  }
}

async function testCombinedGeneration() {
  console.log('\nTesting Combined API Generation...')
  try {
    const combinedRegistry = new ZodRegistry({
      title: 'Combined API Test',
      version: '1.0.0',
    })
    
    console.log('  Registering Public API...')
    registerPublicAPI(combinedRegistry)
    console.log('  ✓ Public API registered')
    
    console.log('  Registering Admin API...')
    registerAdminAPI(combinedRegistry)
    console.log('  ✓ Admin API registered')
    
    console.log('  Registering Internal API...')
    registerInternalAPI(combinedRegistry)
    console.log('  ✓ Internal API registered')
    
    console.log('  Generating combined document...')
    const doc = combinedRegistry.generateDocument()
    console.log('✓ Combined API document generated successfully')
  } catch (error) {
    console.error('✗ Combined API failed:', error.message)
    console.error(error.stack)
  }
}

testGenerators().then(() => testCombinedGeneration())