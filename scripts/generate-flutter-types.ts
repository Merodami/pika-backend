#!/usr/bin/env tsx

/**
 * 🚀 Flutter Type Generator for Pika Backend
 *
 * This script generates type-safe Dart models from your Zod schemas using:
 * - Zod 4's native JSON Schema generation (z.toJSONSchema)
 * - QuickType for Dart code generation
 *
 * Features:
 * ✅ Single source of truth from Zod schemas
 * ✅ Type-safe Dart models with null safety
 * ✅ Automatic serialization/deserialization
 * ✅ Enum handling and documentation preservation
 * ✅ Individual module files for better organization
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'

// ============= Configuration =============

const CONFIG = {
  // Output directories
  FLUTTER_PROJECT: path.resolve('../pika-frontend-flutter'),
  OUTPUT_DIR: path.resolve('generated/flutter'),
  JSON_SCHEMA_DIR: path.resolve('generated/flutter/schemas'),
  DART_OUTPUT_DIR: path.resolve('../pika-frontend-flutter/lib/generated/api'),

  // JSON Schema settings
  JSON_SCHEMA_TARGET: 'draft-7' as const, // Best compatibility with quicktype

  // QuickType settings
  DART_CLASS_PREFIX: '',
  DART_CLASS_SUFFIX: '',
}

// ============= Schema Import Configuration =============

/**
 * Define your schema modules here
 * Add new modules as you create them
 */
const SCHEMA_MODULES = {
  auth: {
    login: () => import('../packages/api/src/schemas/auth/public/login.js'),
    register: () =>
      import('../packages/api/src/schemas/auth/public/register.js'),
    password: () =>
      import('../packages/api/src/schemas/auth/public/password.js'),
  },
  business: {
    business: () =>
      import('../packages/api/src/schemas/business/public/business.js'),
  },
  category: {
    category: () =>
      import('../packages/api/src/schemas/category/public/category.js'),
  },
  user: {
    profile: () => import('../packages/api/src/schemas/user/public/profile.js'),
  },
  voucher: {
    voucher: () =>
      import('../packages/api/src/schemas/voucher/public/voucher.js'),
  },
}

// ============= Utility Functions =============

function createDirectories() {
  const dirs = [
    CONFIG.OUTPUT_DIR,
    CONFIG.JSON_SCHEMA_DIR,
    CONFIG.DART_OUTPUT_DIR,
  ]

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function isZodSchema(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.parse === 'function' &&
    obj._def !== undefined
  )
}

function shouldSkipSchema(name: string): boolean {
  // Skip OpenAPI decorated schemas (we want raw Zod schemas)
  return (
    name.endsWith('Schema') ||
    name.endsWith('ResponseSchema') ||
    name.endsWith('RequestSchema')
  )
}

function cleanJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const cleaned = { ...schema }

  // Clean up empty or invalid properties that cause QuickType issues
  if (cleaned.properties) {
    for (const [key, value] of Object.entries(cleaned.properties)) {
      if (typeof value === 'object') {
        const propSchema = value as any

        // Check if the property schema is missing a type
        if (
          !propSchema.type &&
          !propSchema.enum &&
          !propSchema.const &&
          !propSchema.anyOf &&
          !propSchema.oneOf &&
          !propSchema.allOf &&
          !propSchema.$ref &&
          Object.keys(propSchema).length > 0
        ) {
          // Has properties but no type definition - add string type
          cleaned.properties[key] = { ...propSchema, type: 'string' }
        } else if (Object.keys(propSchema).length === 0) {
          // Completely empty schema - replace with string type
          cleaned.properties[key] = { type: 'string' }
        } else {
          // Recursively clean nested schemas
          cleaned.properties[key] = cleanJsonSchema(propSchema)
        }
      }
    }
  }

  // Clean up nested schemas
  if (cleaned.items) {
    cleaned.items = cleanJsonSchema(cleaned.items)
  }

  if (
    cleaned.additionalProperties &&
    typeof cleaned.additionalProperties === 'object'
  ) {
    cleaned.additionalProperties = cleanJsonSchema(cleaned.additionalProperties)
  }

  return cleaned
}

function formatModuleName(moduleName: string, submoduleName: string): string {
  return `${moduleName}_${submoduleName}`
}

function formatDartFileName(moduleName: string, submoduleName: string): string {
  return `${moduleName}_${submoduleName}_types.dart`
}

// ============= JSON Schema Generation =============

async function generateJsonSchemas() {
  console.log('📝 Generating JSON Schemas from Zod schemas...')

  const generatedSchemas: Record<string, any> = {}

  let totalSchemas = 0

  for (const [moduleName, submodules] of Object.entries(SCHEMA_MODULES)) {
    console.log(`\\n  📁 Processing ${moduleName} module...`)

    for (const [submoduleName, importFn] of Object.entries(submodules)) {
      console.log(`    📄 Loading ${submoduleName} schemas...`)

      try {
        const moduleSchemas = await importFn()

        let moduleSchemaCount = 0

        for (const [schemaName, schema] of Object.entries(moduleSchemas)) {
          if (!isZodSchema(schema)) {
            continue
          }

          if (shouldSkipSchema(schemaName)) {
            console.log(`      📄 Skipping ${schemaName}: OpenAPI decorated`)
            continue
          }

          try {
            // Use Zod 4's native JSON Schema generation
            const rawJsonSchema = z.toJSONSchema(schema as any, {
              target: CONFIG.JSON_SCHEMA_TARGET,
              unrepresentable: 'any',
            })

            // Clean the schema to fix QuickType compatibility issues
            const jsonSchema = cleanJsonSchema(rawJsonSchema)

            const fullName = `${formatModuleName(moduleName, submoduleName)}_${schemaName}`

            generatedSchemas[fullName] = {
              schema: jsonSchema,
              moduleName,
              submoduleName,
              schemaName,
            }

            // Save individual JSON schema file
            const jsonSchemaPath = path.join(
              CONFIG.JSON_SCHEMA_DIR,
              `${fullName}.json`,
            )

            fs.writeFileSync(
              jsonSchemaPath,
              JSON.stringify(jsonSchema, null, 2),
            )

            moduleSchemaCount++
            totalSchemas++
            console.log(`      ✅ ${schemaName}`)
          } catch (error) {
            console.log(`      ⚠️  Skipping ${schemaName}: ${error.message}`)
          }
        }

        console.log(
          `    📊 Generated ${moduleSchemaCount} schemas from ${submoduleName}`,
        )
      } catch (error) {
        console.error(`    ❌ Failed to load ${submoduleName}:`, error.message)
      }
    }
  }

  console.log(`\\n📊 Total: Generated ${totalSchemas} JSON schemas`)

  return generatedSchemas
}

// ============= Dart Code Generation =============

function generateDartTypes(schemas: Record<string, any>) {
  console.log('\\n🎯 Generating Dart types...')

  // Group schemas by module
  const moduleGroups: Record<string, any[]> = {}

  for (const [fullName, schemaData] of Object.entries(schemas)) {
    const moduleKey = formatModuleName(
      schemaData.moduleName,
      schemaData.submoduleName,
    )

    if (!moduleGroups[moduleKey]) {
      moduleGroups[moduleKey] = []
    }
    moduleGroups[moduleKey].push(schemaData)
  }

  let successCount = 0
  let failCount = 0

  // Generate Dart files for each module
  for (const [moduleKey, moduleSchemas] of Object.entries(moduleGroups)) {
    console.log(`\\n  📁 Generating ${moduleKey} types...`)

    try {
      // First, try the combined schema approach
      const moduleProperties: Record<string, any> = {}

      for (const schemaData of moduleSchemas) {
        // Clean each schema before combining
        moduleProperties[schemaData.schemaName] = cleanJsonSchema(
          schemaData.schema,
        )
      }

      const moduleSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)}Types`,
        type: 'object',
        properties: moduleProperties,
      }

      // Save module schema
      const moduleSchemaPath = path.join(
        CONFIG.JSON_SCHEMA_DIR,
        `${moduleKey}_combined.json`,
      )

      fs.writeFileSync(moduleSchemaPath, JSON.stringify(moduleSchema, null, 2))

      // Generate Dart code using QuickType
      const dartFileName = `${moduleKey}.dart`
      const dartFilePath = path.join(CONFIG.DART_OUTPUT_DIR, dartFileName)

      const quicktypeCommand = [
        'npx quicktype',
        `--src "${moduleSchemaPath}"`,
        '--src-lang schema',
        '--lang dart',
        `--out "${dartFilePath}"`,
        `--top-level ${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)}`,
      ].join(' ')

      console.log(`    🔄 Running: ${quicktypeCommand}`)

      const result = execSync(quicktypeCommand, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      // Verify the file was created
      if (fs.existsSync(dartFilePath)) {
        const fileSize = fs.statSync(dartFilePath).size

        console.log(`    ✅ Generated ${dartFileName} (${fileSize} bytes)`)
        successCount++
      } else {
        console.log(`    ❌ Failed to generate ${dartFileName}`)
        failCount++
      }
    } catch (error) {
      console.log(`    ❌ Combined schema failed: ${error.message}`)
      console.log(`    🔄 Trying individual schemas approach...`)

      // Fallback: Generate individual files for each schema
      let individualSuccessCount = 0

      try {
        const individualDartContent: string[] = []
        const seenEnums = new Set<string>()
        const seenClasses = new Set<string>()
        const seenVariables = new Set<string>()

        // Add Dart imports
        individualDartContent.push('// To parse this JSON data, do')
        individualDartContent.push('//')
        individualDartContent.push(
          `//     final data = SomeClass.fromJson(jsonData);`,
        )
        individualDartContent.push('')
        individualDartContent.push('import "dart:convert";')
        individualDartContent.push('')

        for (const schemaData of moduleSchemas) {
          console.log(
            `      🔄 Generating individual ${schemaData.schemaName}...`,
          )

          const individualSchema = cleanJsonSchema(schemaData.schema)
          const individualSchemaPath = path.join(
            CONFIG.JSON_SCHEMA_DIR,
            `${moduleKey}_${schemaData.schemaName}_individual.json`,
          )

          fs.writeFileSync(
            individualSchemaPath,
            JSON.stringify(individualSchema, null, 2),
          )

          const tempDartPath = path.join(
            CONFIG.DART_OUTPUT_DIR,
            `temp_${schemaData.schemaName}.dart`,
          )

          const individualCommand = [
            'npx quicktype',
            `--src "${individualSchemaPath}"`,
            '--src-lang schema',
            '--lang dart',
            `--out "${tempDartPath}"`,
            `--top-level ${schemaData.schemaName}`,
          ].join(' ')

          try {
            execSync(individualCommand, { stdio: ['pipe', 'pipe', 'pipe'] })

            if (fs.existsSync(tempDartPath)) {
              const content = fs.readFileSync(tempDartPath, 'utf8')
              const lines = content.split('\n')

              // Filter out duplicate definitions with improved logic
              const filteredLines: string[] = []

              let skipBlock = false
              let blockDepth = 0

              for (const line of lines) {
                const trimmedLine = line.trim()

                // Skip imports and initial comments
                if (
                  line.startsWith('//') ||
                  line.startsWith('import') ||
                  trimmedLine === ''
                ) {
                  continue
                }

                // Track opening braces for block depth
                if (trimmedLine.includes('{')) {
                  blockDepth += (trimmedLine.match(/{/g) || []).length
                }

                // Check for duplicate definitions
                if (!skipBlock) {
                  if (line.startsWith('enum ')) {
                    const enumName = line.split(' ')[1].replace('{', '')

                    if (seenEnums.has(enumName)) {
                      skipBlock = true
                      continue
                    }
                    seenEnums.add(enumName)
                  } else if (line.startsWith('class ')) {
                    const className = line.split(' ')[1].replace('{', '')

                    if (seenClasses.has(className)) {
                      skipBlock = true
                      continue
                    }
                    seenClasses.add(className)
                  } else if (line.startsWith('final ')) {
                    const varName = line.split(' ')[1]

                    if (seenVariables.has(varName)) {
                      skipBlock = true
                      continue
                    }
                    seenVariables.add(varName)
                  }
                }

                // Track closing braces for block end detection
                if (trimmedLine.includes('}')) {
                  const closingBraces = (trimmedLine.match(/}/g) || []).length

                  blockDepth -= closingBraces

                  // End of block detection
                  if (skipBlock && blockDepth <= 0) {
                    skipBlock = false
                    blockDepth = 0
                    continue
                  }
                }

                if (!skipBlock) {
                  filteredLines.push(line)
                }
              }

              if (filteredLines.length > 0) {
                individualDartContent.push(...filteredLines)
                individualDartContent.push('')
                individualSuccessCount++
                console.log(`        ✅ ${schemaData.schemaName}`)
              }

              fs.unlinkSync(tempDartPath) // Clean up temp file
            }
          } catch (individualError) {
            console.log(
              `        ❌ ${schemaData.schemaName}: ${individualError.message}`,
            )
          }
        }

        if (individualSuccessCount > 0) {
          // Write the combined file
          const dartFileName = `${moduleKey}.dart`
          const dartFilePath = path.join(CONFIG.DART_OUTPUT_DIR, dartFileName)

          fs.writeFileSync(dartFilePath, individualDartContent.join('\n'))

          console.log(
            `    ✅ Generated ${dartFileName} with ${individualSuccessCount}/${moduleSchemas.length} schemas`,
          )
          successCount++
        } else {
          console.log(`    ❌ All individual schemas failed for ${moduleKey}`)
          failCount++
        }
      } catch (fallbackError) {
        console.log(`    ❌ Fallback approach failed: ${fallbackError.message}`)
        failCount++
      }
    }
  }

  console.log(`\\n📊 Dart Generation Summary:`)
  console.log(`   ✅ Successful: ${successCount} modules`)
  console.log(`   ❌ Failed: ${failCount} modules`)

  return { successCount, failCount }
}

// ============= Validation =============

function validateOutput() {
  console.log('\\n🔍 Validating generated files...')

  const dartFiles = fs
    .readdirSync(CONFIG.DART_OUTPUT_DIR)
    .filter((f) => f.endsWith('.dart'))

  console.log(`\\n📁 Generated Dart files:`)

  let totalClasses = 0
  let totalEnums = 0
  let totalMethods = 0

  for (const file of dartFiles) {
    const filePath = path.join(CONFIG.DART_OUTPUT_DIR, file)
    const content = fs.readFileSync(filePath, 'utf8')

    const classCount = (content.match(/class \\w+/g) || []).length
    const enumCount = (content.match(/enum \\w+/g) || []).length
    const methodCount = (
      content.match(/factory \\w+\\.fromJson|Map<String, dynamic> toJson/g) ||
      []
    ).length

    totalClasses += classCount
    totalEnums += enumCount
    totalMethods += methodCount

    console.log(`   📄 ${file}:`)
    console.log(`      - ${classCount} classes`)
    console.log(`      - ${enumCount} enums`)
    console.log(`      - ${methodCount} serialization methods`)
  }

  console.log(`\\n📊 Validation Summary:`)
  console.log(`   📄 ${dartFiles.length} Dart files`)
  console.log(`   🏗️  ${totalClasses} classes`)
  console.log(`   🔢 ${totalEnums} enums`)
  console.log(`   ⚙️  ${totalMethods} serialization methods`)

  // Check Flutter project structure
  const pubspecPath = path.join(CONFIG.FLUTTER_PROJECT, 'pubspec.yaml')

  if (fs.existsSync(pubspecPath)) {
    console.log(`   ✅ Flutter project detected`)
  } else {
    console.log(`   ⚠️  Flutter project not found at ${CONFIG.FLUTTER_PROJECT}`)
  }

  return {
    files: dartFiles.length,
    classes: totalClasses,
    enums: totalEnums,
    methods: totalMethods,
  }
}

// ============= Documentation Generation =============

function generateDocumentation(stats: any) {
  const readmePath = path.join(CONFIG.OUTPUT_DIR, 'README.md')

  const documentation = `# Generated Flutter Types

This directory contains automatically generated Dart types from your Zod schemas.

## 📊 Generation Stats

- **${stats.files}** Dart files
- **${stats.classes}** classes
- **${stats.enums}** enums  
- **${stats.methods}** serialization methods

## 📁 Structure

\\\`\\\`\\\`
lib/generated/api/
├── auth_login.dart          # Authentication login types
├── auth_register.dart       # Authentication registration types
├── business_business.dart   # Business management types
├── category_category.dart   # Category types
├── user_profile.dart        # User profile types
└── voucher_voucher.dart     # Voucher types
\\\`\\\`\\\`

## 🚀 Usage in Flutter

\\\`\\\`\\\`dart
import 'package:your_app/generated/api/auth_login.dart';

// Use the generated types
final authResponse = AuthLogin.fromJson(jsonData);
print(authResponse.accessToken);
\\\`\\\`\\\`

## 🔄 Regeneration

To regenerate these types after updating your Zod schemas:

\\\`\\\`\\\`bash
# From the backend directory
yarn generate:flutter-types
\\\`\\\`\\\`

---
*Generated automatically from Zod schemas using native z.toJSONSchema() and QuickType*
`

  fs.writeFileSync(readmePath, documentation)
  console.log(`\\n📚 Generated documentation: ${readmePath}`)
}

// ============= Main Execution =============

async function main() {
  console.log('🚀 Flutter Type Generator for Pika Backend')
  console.log('==========================================')

  const startTime = Date.now()

  try {
    // Step 1: Setup
    console.log('\\n🏗️  Setting up directories...')
    createDirectories()

    // Step 2: Generate JSON Schemas
    const schemas = await generateJsonSchemas()

    if (Object.keys(schemas).length === 0) {
      console.log('\\n❌ No schemas found to generate!')
      process.exit(1)
    }

    // Step 3: Generate Dart Types
    const { successCount, failCount } = generateDartTypes(schemas)

    if (successCount === 0) {
      console.log('\\n❌ No Dart files were generated!')
      process.exit(1)
    }

    // Step 4: Validate Output
    const stats = validateOutput()

    // Step 5: Generate Documentation
    generateDocumentation(stats)

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\\n🎉 Generation Complete!')
    console.log('========================')
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`📁 Output: ${CONFIG.DART_OUTPUT_DIR}`)
    console.log(`📚 Documentation: ${CONFIG.OUTPUT_DIR}/README.md`)

    console.log('\\n📋 Next Steps:')
    console.log('1. Run "flutter pub get" in your Flutter project')
    console.log('2. Import the generated types in your Dart code')
    console.log('3. Use the type-safe models for API integration')

    if (failCount > 0) {
      console.log(
        `\\n⚠️  ${failCount} modules failed to generate. Check the logs above.`,
      )
      process.exit(1)
    }
  } catch (error) {
    console.error('\\n❌ Fatal error:', error)
    process.exit(1)
  }
}

// ============= Error Handling =============

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
