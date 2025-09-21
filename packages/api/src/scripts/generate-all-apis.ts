#!/usr/bin/env tsx

// Load environment variables before importing anything else
import { config } from 'dotenv'
import { dirname as pathDirname, join as pathJoin } from 'path'
import { fileURLToPath as fileUrlToPath } from 'url'

const __currentFilename = fileUrlToPath(import.meta.url)
const __currentDirname = pathDirname(__currentFilename)

// Load environment variables from project root
config({ path: pathJoin(__currentDirname, '../../../../.env') })
config({ path: pathJoin(__currentDirname, '../../../../.env.local') })

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import {
  AUTH_SERVICE_PORT,
  BUSINESS_SERVICE_PORT,
  CATEGORY_SERVICE_PORT,
  COMMUNICATION_SERVICE_PORT,
  FILE_STORAGE_SERVICE_PORT,
  getAdminApiUrl,
  getApiUrl,
  getInternalApiUrl,
  PAYMENT_SERVICE_PORT,
  PDF_SERVICE_PORT,
  SERVICE_HOST,
  SUBSCRIPTION_SERVICE_PORT,
  SUPPORT_SERVICE_PORT,
  USER_SERVICE_PORT,
  VOUCHER_SERVICE_PORT,
} from '@pika/environment'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { createRegistry } from '../common/registry/base.js'
import { registerAdminAPI } from './generators/admin-api.js'
import { registerBusinessAPI } from './generators/business-api.js'
import { registerInternalAPI } from './generators/internal-api.js'
import { registerPublicAPI } from './generators/public-api.js'

/**
 * Generate OpenAPI specifications for all three APIs
 */

// Extend Zod with OpenAPI
extendZodWithOpenApi(z)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Output directory
const OUTPUT_DIR = join(__dirname, '../../generated/openapi')

// ============= Public API =============
const publicRegistry = createRegistry({
  title: 'The VoucherBook Public API',
  version: '1.0.0',
  description: 'Public API for The VoucherBook mobile and web applications',
  servers: [
    {
      url: getApiUrl('local'),
      description: 'Local Development',
    },
    { url: getApiUrl('production'), description: 'Production' },
    {
      url: getApiUrl('staging'),
      description: 'Staging',
    },
  ],
})

// Register all public schemas and routes
registerPublicAPI(publicRegistry)

// ============= Admin API =============
const adminRegistry = createRegistry({
  title: 'The VoucherBook Admin API',
  version: '1.0.0',
  description: 'Administrative API for The VoucherBook platform management',
  servers: [
    {
      url: getAdminApiUrl('local'),
      description: 'Local Development',
    },
    { url: getAdminApiUrl('production'), description: 'Production' },
    {
      url: getAdminApiUrl('staging'),
      description: 'Staging',
    },
  ],
})

// Register all admin schemas and routes
registerAdminAPI(adminRegistry)

// ============= Business API =============
const businessRegistry = createRegistry({
  title: 'The VoucherBook Business API',
  version: '1.0.0',
  description: 'Business owner API for managing their own businesses',
  servers: [
    {
      url: getApiUrl('local'),
      description: 'Local Development',
    },
    { url: getApiUrl('production'), description: 'Production' },
    {
      url: getApiUrl('staging'),
      description: 'Staging',
    },
  ],
})

// Register all business schemas and routes
registerBusinessAPI(businessRegistry)

// ============= Internal API =============
const internalRegistry = createRegistry({
  title: 'The VoucherBook Internal API',
  version: '1.0.0',
  description: 'Internal service-to-service communication API',
  servers: [
    {
      url: getInternalApiUrl('local'),
      description: 'Local Development (All Services)',
    },
    {
      url: getInternalApiUrl('production'),
      description: 'Production Internal API',
    },
    {
      url: getInternalApiUrl('staging'),
      description: 'Staging Internal API',
    },
    // Service-specific endpoints for local development
    {
      url: `http://${SERVICE_HOST}:${AUTH_SERVICE_PORT}`,
      description: 'Auth Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${USER_SERVICE_PORT}`,
      description: 'User Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${BUSINESS_SERVICE_PORT}`,
      description: 'Business Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${CATEGORY_SERVICE_PORT}`,
      description: 'Category Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${VOUCHER_SERVICE_PORT}`,
      description: 'Voucher Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUBSCRIPTION_SERVICE_PORT}`,
      description: 'Subscription Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${COMMUNICATION_SERVICE_PORT}`,
      description: 'Communication Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${FILE_STORAGE_SERVICE_PORT}`,
      description: 'Storage Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${PAYMENT_SERVICE_PORT}`,
      description: 'Payment Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUPPORT_SERVICE_PORT}`,
      description: 'Support Service (Direct)',
    },
    {
      url: `http://${SERVICE_HOST}:${PDF_SERVICE_PORT}`,
      description: 'PDF Service (Direct)',
    },
  ],
})

// Register all internal schemas and routes
registerInternalAPI(internalRegistry)

// ============= Combined API (All APIs) =============
const allApisRegistry = createRegistry({
  title: 'The VoucherBook Complete API',
  version: '1.0.0',
  description:
    'Complete API documentation including public, admin, and internal endpoints',
  servers: [
    {
      url: getApiUrl('local'),
      description: 'API Gateway (Local)',
    },
    {
      url: getApiUrl('production'),
      description: 'API Gateway (Production)',
    },
    {
      url: getApiUrl('staging'),
      description: 'API Gateway (Staging)',
    },
    // Direct service endpoints for internal communication
    {
      url: `http://${SERVICE_HOST}:${AUTH_SERVICE_PORT}`,
      description: 'Auth Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${USER_SERVICE_PORT}`,
      description: 'User Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${BUSINESS_SERVICE_PORT}`,
      description: 'Business Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${CATEGORY_SERVICE_PORT}`,
      description: 'Category Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${VOUCHER_SERVICE_PORT}`,
      description: 'Voucher Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUBSCRIPTION_SERVICE_PORT}`,
      description: 'Subscription Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${COMMUNICATION_SERVICE_PORT}`,
      description: 'Communication Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${FILE_STORAGE_SERVICE_PORT}`,
      description: 'Storage Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${PAYMENT_SERVICE_PORT}`,
      description: 'Payment Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUPPORT_SERVICE_PORT}`,
      description: 'Support Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${PDF_SERVICE_PORT}`,
      description: 'PDF Service (Internal)',
    },
  ],
})

// Register all APIs into the combined registry
registerPublicAPI(allApisRegistry)
registerAdminAPI(allApisRegistry)
registerBusinessAPI(allApisRegistry)
registerInternalAPI(allApisRegistry)

// Generate OpenAPI documents
const publicDoc = publicRegistry.generateDocument()
const adminDoc = adminRegistry.generateDocument()
const businessDoc = businessRegistry.generateDocument()
const internalDoc = internalRegistry.generateDocument()
const allApisDoc = allApisRegistry.generateDocument()

// Create output directory if it doesn't exist
mkdirSync(OUTPUT_DIR, { recursive: true })

// Write OpenAPI documents
writeFileSync(
  join(OUTPUT_DIR, 'public-api.json'),
  JSON.stringify(publicDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'admin-api.json'),
  JSON.stringify(adminDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'business-api.json'),
  JSON.stringify(businessDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'internal-api.json'),
  JSON.stringify(internalDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'all-apis.json'),
  JSON.stringify(allApisDoc, null, 2),
)

console.log('✅ OpenAPI documents generated successfully:')
console.log(`   📄 ${join(OUTPUT_DIR, 'public-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'admin-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'business-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'internal-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'all-apis.json')}`)

// Also generate a simple index file for serving
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The VoucherBook API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 0.5rem;
        }
        .api-list {
            list-style: none;
            padding: 0;
        }
        .api-item {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .api-item h2 {
            margin-top: 0;
            color: #007bff;
        }
        .api-item p {
            color: #666;
            margin: 0.5rem 0;
        }
        .api-links {
            margin-top: 1rem;
        }
        .api-links a {
            display: inline-block;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .api-links a:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <h1>The VoucherBook API Documentation</h1>
    
    <ul class="api-list">
        <li class="api-item">
            <h2>Public API</h2>
            <p>API endpoints for mobile and web applications</p>
            <div class="api-links">
                <a href="public-api.json">OpenAPI JSON</a>
                <a href="public">View Documentation</a>
            </div>
        </li>
        
        <li class="api-item">
            <h2>Admin API</h2>
            <p>Administrative endpoints for platform management</p>
            <div class="api-links">
                <a href="admin-api.json">OpenAPI JSON</a>
                <a href="admin">View Documentation</a>
            </div>
        </li>

        <li class="api-item">
            <h2>Business API</h2>
            <p>Business owner endpoints for managing their businesses</p>
            <div class="api-links">
                <a href="business-api.json">OpenAPI JSON</a>
                <a href="business">View Documentation</a>
            </div>
        </li>

        <li class="api-item">
            <h2>Internal API</h2>
            <p>Service-to-service communication endpoints</p>
            <div class="api-links">
                <a href="internal-api.json">OpenAPI JSON</a>
                <a href="internal">View Documentation</a>
            </div>
        </li>
        
        <li class="api-item">
            <h2>Complete API</h2>
            <p>All APIs combined in a single specification</p>
            <div class="api-links">
                <a href="all-apis.json">OpenAPI JSON</a>
                <a href="all-apis">View Documentation</a>
            </div>
        </li>
    </ul>
</body>
</html>
`

writeFileSync(join(OUTPUT_DIR, 'index.html'), indexHtml)
console.log(`   📄 ${join(OUTPUT_DIR, 'index.html')}`)

// Copy JSON files to api-gateway src for build-time inclusion (Vercel deployment)
const API_GATEWAY_SRC_DOCS_DIR = join(
  __dirname,
  '../../../api-gateway/src/docs/openapi',
)

console.log(
  '\n📋 Copying OpenAPI JSON to api-gateway src for build-time inclusion...',
)

// Create the api-gateway src docs/openapi directory
mkdirSync(API_GATEWAY_SRC_DOCS_DIR, { recursive: true })

// Copy all OpenAPI JSON files for serving
const jsonFiles = [
  'public-api.json',
  'admin-api.json',
  'business-api.json',
  'internal-api.json',
  'all-apis.json',
]

for (const file of jsonFiles) {
  if (!file.endsWith('.json')) {
    throw new Error(`Invalid file type: ${file}`)
  }

  const sourcePath = join(OUTPUT_DIR, file)
  const destPath = join(API_GATEWAY_SRC_DOCS_DIR, file)

  if (
    !sourcePath.startsWith(OUTPUT_DIR) ||
    !destPath.startsWith(API_GATEWAY_SRC_DOCS_DIR)
  ) {
    throw new Error(`Path traversal detected: ${file}`)
  }

  const content = readFileSync(sourcePath, 'utf8')

  writeFileSync(destPath, content)
  console.log(`  📄 Copied ${file} to api-gateway/src/docs/openapi`)
}
