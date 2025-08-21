#!/usr/bin/env tsx

/**
 * Generate Dart types from Zod schemas
 * This script converts Zod schemas → JSON Schema → Dart types
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'

// Import all your Zod schemas
import * as authLoginSchemas from '../packages/api/src/schemas/auth/public/login.js'
import * as authRegisterSchemas from '../packages/api/src/schemas/auth/public/register.js'
import * as businessSchemas from '../packages/api/src/schemas/business/public/business.js'
import * as categorySchemas from '../packages/api/src/schemas/category/public/category.js'
import * as userProfileSchemas from '../packages/api/src/schemas/user/public/profile.js'
import * as voucherSchemas from '../packages/api/src/schemas/voucher/public/voucher.js'

// Collect all schemas
const schemas = {
  authLogin: authLoginSchemas,
  authRegister: authRegisterSchemas,
  business: businessSchemas,
  category: categorySchemas,
  userProfile: userProfileSchemas,
  voucher: voucherSchemas,
}

const OUTPUT_DIR = path.join(process.cwd(), 'generated', 'flutter')
const JSON_SCHEMA_DIR = path.join(OUTPUT_DIR, 'json-schemas')
const DART_OUTPUT_DIR = path.join(
  process.cwd(),
  '..',
  'pika-frontend-flutter',
  'lib',
  'generated',
  'models',
)

// Create directories
fs.mkdirSync(JSON_SCHEMA_DIR, { recursive: true })
fs.mkdirSync(DART_OUTPUT_DIR, { recursive: true })

console.log('🚀 Starting Dart type generation from Zod schemas...')

// Step 1: Convert Zod schemas to JSON Schema
console.log('\n📝 Converting Zod schemas to JSON Schema...')

const allJsonSchemas: Record<string, any> = {}

for (const [moduleName, moduleSchemas] of Object.entries(schemas)) {
  console.log(`  Processing ${moduleName} schemas...`)
  
  for (const [schemaName, schema] of Object.entries(moduleSchemas)) {
    // Skip non-Zod objects and functions
    if (!schema || typeof schema !== 'object' || !('parse' in schema)) {
      continue
    }
    
    // Skip OpenAPI-decorated schemas (those ending with 'Schema')
    // We want the raw Zod schemas only
    if (schemaName.endsWith('Schema') || schemaName.endsWith('ResponseSchema') || schemaName.endsWith('RequestSchema')) {
      console.log(`    📄 Skipping ${schemaName}: OpenAPI decorated schema`)
      continue
    }
    
    try {
      // Use Zod 4's native JSON Schema generation
      const jsonSchema = z.toJSONSchema(schema as any, {
        target: 'draft-7', // Use JSON Schema draft that quicktype supports
        unrepresentable: 'any',  // Convert unrepresentable types to 'any'
      })
      
      const fullName = `${moduleName}_${schemaName}`
      allJsonSchemas[fullName] = jsonSchema
      
      // Save individual JSON schema file
      const jsonSchemaPath = path.join(JSON_SCHEMA_DIR, `${fullName}.json`)
      fs.writeFileSync(
        jsonSchemaPath,
        JSON.stringify(jsonSchema, null, 2),
      )
      
      console.log(`    ✅ ${schemaName}`)
    } catch (error) {
      console.log(`    ⚠️  Skipping ${schemaName}: ${error.message}`)
    }
  }
}

// Step 2: Combine all schemas into a single file for quicktype
console.log('\n📦 Combining schemas for Dart generation...')

const combinedSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'PikaAPITypes',
  type: 'object',
  properties: allJsonSchemas,
}

const combinedSchemaPath = path.join(OUTPUT_DIR, 'combined-schema.json')
fs.writeFileSync(combinedSchemaPath, JSON.stringify(combinedSchema, null, 2))

// Step 3: Generate Dart types using quicktype
console.log('\n🎯 Generating Dart types...')

try {
  const quicktypeCommand = `
    npx quicktype \
      --src "${combinedSchemaPath}" \
      --src-lang schema \
      --lang dart \
      --out "${path.join(DART_OUTPUT_DIR, 'api_types.dart')}" \
      --top-level PikaApiTypes
  `.trim()
  
  execSync(quicktypeCommand, { stdio: 'inherit' })
  
  console.log('✅ Dart types generated successfully!')
  console.log(`📁 Output location: ${DART_OUTPUT_DIR}`)
  
  // Step 4: Generate a separate file for each module
  console.log('\n📂 Generating module-specific Dart files...')
  
  for (const [moduleName, moduleSchemas] of Object.entries(schemas)) {
    const moduleProperties: Record<string, any> = {}
    
    for (const [schemaName, schema] of Object.entries(moduleSchemas)) {
      if (!schema || typeof schema !== 'object' || !('parse' in schema)) {
        continue
      }
      
      // Skip OpenAPI-decorated schemas
      if (schemaName.endsWith('Schema') || schemaName.endsWith('ResponseSchema') || schemaName.endsWith('RequestSchema')) {
        continue
      }
      
      const fullName = `${moduleName}_${schemaName}`
      if (allJsonSchemas[fullName]) {
        moduleProperties[schemaName] = allJsonSchemas[fullName]
      }
    }
    
    if (Object.keys(moduleProperties).length > 0) {
      const moduleSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Types`,
        type: 'object',
        properties: moduleProperties,
      }
      
      const moduleSchemaPath = path.join(OUTPUT_DIR, `${moduleName}-schema.json`)
      fs.writeFileSync(moduleSchemaPath, JSON.stringify(moduleSchema, null, 2))
      
      const dartFileName = `${moduleName}_types.dart`
      const moduleQuicktypeCommand = `
        npx quicktype \
          --src "${moduleSchemaPath}" \
          --src-lang schema \
          --lang dart \
          --out "${path.join(DART_OUTPUT_DIR, dartFileName)}" \
          --top-level ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Types
      `.trim()
      
      try {
        execSync(moduleQuicktypeCommand, { stdio: 'inherit' })
        console.log(`  ✅ Generated ${dartFileName}`)
      } catch (error) {
        console.error(`  ❌ Failed to generate ${dartFileName}`)
      }
    }
  }
  
  console.log('\n🎉 Dart type generation complete!')
  console.log('\nNext steps:')
  console.log('1. Run "flutter pub get" in the Flutter project')
  console.log('2. Run "flutter pub run build_runner build" to generate freezed files')
  console.log('3. Import and use the generated types in your Flutter app')
  
} catch (error) {
  console.error('❌ Error generating Dart types:', error)
  process.exit(1)
}