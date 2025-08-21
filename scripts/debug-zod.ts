#!/usr/bin/env tsx

import { zodToJsonSchema } from 'zod-to-json-schema'
import { AuthTokensResponse } from '../packages/api/src/schemas/auth/public/login.js'
import { z } from 'zod'

console.log('🔍 Debugging Zod to JSON Schema conversion...')

// Test the actual schema
console.log('\n📋 AuthTokensResponse schema:')
console.log(AuthTokensResponse)

// Test a simple schema
const simpleSchema = z.object({
  message: z.string(),
  count: z.number()
})

console.log('\n🔍 Simple schema conversion:')
const simpleJsonSchema = zodToJsonSchema(simpleSchema)
console.log(JSON.stringify(simpleJsonSchema, null, 2))

console.log('\n🧪 Testing schema structure:')
console.log('Schema def:', simpleSchema._def)
console.log('Schema shape:', Object.keys(simpleSchema._def.shape()))

console.log('\n🔍 Complex schema conversion:')
try {
  const complexJsonSchema = zodToJsonSchema(AuthTokensResponse, {
    $refStrategy: 'none'
  })
  console.log(JSON.stringify(complexJsonSchema, null, 2))
} catch (error) {
  console.error('Error converting complex schema:', error)
}