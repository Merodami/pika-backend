#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Generate Scalar API documentation - Modern, fast, and beautiful
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const OUTPUT_DIR = join(__dirname, '../../dist')
const OPENAPI_DIR = join(__dirname, '../../generated/openapi')

async function generateScalarDocs() {
  try {
    console.log('🚀 Generating Scalar documentation...')

    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Create Scalar HTML template with embedded spec
    const scalarTemplate = (title: string, spec: object) => `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    type="application/json">
    ${JSON.stringify(spec, null, 2)}
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`

    // Generate docs for each API
    const apis = [
      {
        file: 'public-api.json',
        output: 'public-api-docs.html',
        title: 'The VoucherBook Public API - Scalar',
      },
      {
        file: 'admin-api.json',
        output: 'admin-api-docs.html',
        title: 'The VoucherBook Admin API - Scalar',
      },
      {
        file: 'business-api.json',
        output: 'business-api-docs.html',
        title: 'The VoucherBook Business API - Scalar',
      },
      {
        file: 'internal-api.json',
        output: 'internal-api-docs.html',
        title: 'The VoucherBook Internal API - Scalar',
      },
      {
        file: 'all-apis.json',
        output: 'all-apis-docs.html',
        title: 'The VoucherBook Complete API - Scalar',
      },
    ]

    for (const api of apis) {
      const specPath = join(OPENAPI_DIR, api.file)
      const outputPath = join(OUTPUT_DIR, api.output)

      console.log(`📖 Processing ${api.file}...`)

      // Read the OpenAPI spec
      const spec = JSON.parse(readFileSync(specPath, 'utf8'))

      // Generate HTML with embedded spec
      const htmlOutput = scalarTemplate(api.title, spec)

      writeFileSync(outputPath, htmlOutput)
      console.log(`✅ Generated ${api.output}`)
    }

    // Create a modern index page - with environment awareness
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The VoucherBook API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            background: #0f172a;
            min-height: 100vh;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 80px 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 80px;
        }
        
        .header h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }
        
        .header p {
            font-size: 1.25rem;
            color: #64748b;
            font-weight: 400;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 32px;
            margin-bottom: 80px;
        }
        
        .api-card {
            background: #ffffff;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                0 2px 4px -1px rgba(0, 0, 0, 0.06),
                0 0 0 1px rgba(255, 255, 255, 0.05);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(226, 232, 240, 0.8);
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
        }
        
        .api-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
            border-radius: 24px 24px 0 0;
        }
        
        .api-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(139, 92, 246, 0.03));
            border-radius: 24px;
            pointer-events: none;
        }
        
        .api-card:hover {
            transform: translateY(-12px);
            box-shadow: 
                0 32px 64px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(59, 130, 246, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border-color: rgba(59, 130, 246, 0.2);
        }
        
        .api-card h2 {
            font-size: 1.625rem;
            margin-bottom: 24px;
            color: #1e293b;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 16px;
            position: relative;
            z-index: 2;
            letter-spacing: -0.025em;
        }
        
        .api-card p {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.75;
            flex-grow: 1;
            font-size: 1.05rem;
            position: relative;
            z-index: 2;
            font-weight: 400;
        }
        
        .api-card .badges {
            display: flex;
            gap: 12px;
            margin-bottom: 28px;
            flex-wrap: wrap;
            position: relative;
            z-index: 2;
        }
        
        .badge {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            color: #475569;
            padding: 8px 16px;
            border-radius: 16px;
            font-size: 0.875rem;
            font-weight: 600;
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        
        .badge:hover {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            transform: translateY(-1px);
        }
        
        .api-card a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 16px 32px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 700;
            font-size: 1rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: auto;
            text-align: center;
            gap: 10px;
            position: relative;
            z-index: 2;
            box-shadow: 
                0 4px 12px rgba(59, 130, 246, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            letter-spacing: -0.025em;
        }
        
        .api-card a:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            transform: translateY(-3px);
            box-shadow: 
                0 12px 32px rgba(59, 130, 246, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .all-apis {
            text-align: center;
            margin-bottom: 60px;
        }
        
        .all-apis a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 18px 36px;
            background: #ffffff;
            color: #1e293b;
            text-decoration: none;
            border-radius: 16px;
            font-size: 1.1rem;
            font-weight: 700;
            border: 2px solid #e2e8f0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            gap: 10px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .all-apis a:hover {
            background: #f8fafc;
            border-color: #3b82f6;
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .version-info {
            text-align: center;
            margin-top: 40px;
            padding: 0;
            background: none;
            border: none;
        }
    </style>
    <script>
        // Check if we're in a production environment (non-localhost, non-development)
        function isProductionEnvironment() {
            const hostname = window.location.hostname;
            const isDevelopment = hostname === 'localhost' || 
                                 hostname === '127.0.0.1' || 
                                 hostname.includes('.local') ||
                                 hostname.startsWith('192.168.') ||
                                 hostname.startsWith('10.') ||
                                 hostname.startsWith('172.');
            return !isDevelopment;
        }
        
        function handleLink(event, filename) {
            // If running from http server, prevent default and use directory path
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                event.preventDefault();
                // Map filenames to directory paths
                const pathMap = {
                    'public-api-docs.html': 'public',
                    'admin-api-docs.html': 'admin',
                    'internal-api-docs.html': 'internal',
                    'all-apis-docs.html': 'all'
                };
                window.location.href = pathMap[filename] || filename;
            }
            // If running from file://, the default href with .html will work
        }
        
        // Hide non-public documentation in production
        window.addEventListener('DOMContentLoaded', function() {
            if (isProductionEnvironment()) {
                // Hide admin and internal API cards in production
                const adminCard = document.querySelector('.api-card:nth-child(2)');
                const internalCard = document.querySelector('.api-card:nth-child(3)');
                const allApisSection = document.querySelector('.all-apis');
                
                if (adminCard) adminCard.style.display = 'none';
                if (internalCard) internalCard.style.display = 'none';
                if (allApisSection) allApisSection.style.display = 'none';
                
                // Add a notice for developers
                const container = document.querySelector('.api-grid');
                if (container) {
                    const notice = document.createElement('div');
                    notice.className = 'api-card';
                    notice.style.gridColumn = 'span 2';
                    notice.style.background = '#fef3c7';
                    notice.style.border = '2px solid #f59e0b';
                    notice.innerHTML = \`
                        <h2 style="color: #92400e;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Developer Notice
                        </h2>
                        <p style="color: #78350f;">Admin and Internal API documentation is only available in development environments. The OpenAPI JSON files remain accessible for tooling integration.</p>
                    \`;
                    container.appendChild(notice);
                }
            }
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>The VoucherBook API Documentation</h1>
            <p>Enterprise REST API documentation for The VoucherBook platform</p>
        </div>
        
        <div class="api-grid">
            <div class="api-card">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="m8 12 8-8v16l-8-8z"/>
                    </svg>
                    Public API
                </h2>
                <div class="badges">
                    <span class="badge">JWT Auth</span>
                    <span class="badge">Mobile & Web</span>
                    <span class="badge">v1.0</span>
                </div>
                <p>Complete REST API for client applications featuring user authentication, profile management, session bookings, payment processing, and social interactions.</p>
                <a href="public-api-docs.html" onclick="handleLink(event, 'public-api-docs.html')">View Documentation →</a>
            </div>
            
            <div class="api-card">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #8b5cf6;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <circle cx="12" cy="16" r="1"/>
                        <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Admin API
                </h2>
                <div class="badges">
                    <span class="badge">Admin Auth</span>
                    <span class="badge">Dashboard</span>
                    <span class="badge">v1.0</span>
                </div>
                <p>Administrative REST API for platform management, user oversight, business analytics, and comprehensive system monitoring.</p>
                <a href="admin-api-docs.html" onclick="handleLink(event, 'admin-api-docs.html')">View Documentation →</a>
            </div>

            <div class="api-card">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
                        <path d="M3 21h18"/>
                        <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/>
                        <path d="M5 21V10.85"/>
                        <path d="M19 21V10.85"/>
                        <path d="M9 21v-4"/>
                        <path d="M15 21v-4"/>
                    </svg>
                    Business API
                </h2>
                <div class="badges">
                    <span class="badge">Business Auth</span>
                    <span class="badge">Settings</span>
                    <span class="badge">v1.0</span>
                </div>
                <p>Business owner REST API for managing their own businesses, settings, and configurations.</p>
                <a href="business-api-docs.html" onclick="handleLink(event, 'business-api-docs.html')">View Documentation →</a>
            </div>

            <div class="api-card">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Internal API
                </h2>
                <div class="badges">
                    <span class="badge">API Key</span>
                    <span class="badge">Microservices</span>
                    <span class="badge">v1.0</span>
                </div>
                <p>Internal REST API for service-to-service communication, health checks, and distributed system coordination.</p>
                <a href="internal-api-docs.html" onclick="handleLink(event, 'internal-api-docs.html')">View Documentation →</a>
            </div>
        </div>
        
        <div class="all-apis">
            <a href="all-apis-docs.html" onclick="handleLink(event, 'all-apis-docs.html')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                View Complete API Documentation
            </a>
        </div>
        
        <div class="version-info">
            <div class="footer">
                OpenAPI 3.1 Specification
            </div>
        </div>
    </div>
</body>
</html>`

    writeFileSync(join(OUTPUT_DIR, 'api-docs-index.html'), indexHtml)
    console.log('✅ Generated modern api-docs-index.html')

    // Copy documentation files to api-gateway src for build-time inclusion
    const API_GATEWAY_SRC_DOCS_DIR = join(
      __dirname,
      '../../../api-gateway/src/docs',
    )

    console.log(
      '\n📋 Copying documentation to api-gateway src for build-time inclusion...',
    )

    // Create the api-gateway src docs directory
    mkdirSync(API_GATEWAY_SRC_DOCS_DIR, { recursive: true })

    // Copy only public API documentation files for production deployment
    const docFiles = ['public-api-docs.html', 'api-docs-index.html']

    for (const file of docFiles) {
      const sourcePath = join(OUTPUT_DIR, file)
      const destPath = join(API_GATEWAY_SRC_DOCS_DIR, file)
      const content = readFileSync(sourcePath, 'utf8')

      writeFileSync(destPath, content)
      console.log(`  📄 Copied ${file}`)
    }

    // Also copy only public API OpenAPI JSON spec
    const OPENAPI_DEST_DIR = join(API_GATEWAY_SRC_DOCS_DIR, 'openapi')

    mkdirSync(OPENAPI_DEST_DIR, { recursive: true })

    // Only copy public API spec for production
    const publicApiFile = 'public-api.json'
    const sourcePath = join(OPENAPI_DIR, publicApiFile)
    const destPath = join(OPENAPI_DEST_DIR, publicApiFile)
    const content = readFileSync(sourcePath, 'utf8')

    writeFileSync(destPath, content)
    console.log(`  📋 Copied ${publicApiFile}`)

    console.log('\n🎉 Scalar documentation generated successfully!')
    console.log('\nView your beautiful API docs:')
    console.log('  📖 Index: yarn open:docs:all')
    console.log(`  🌐 Public: open ${OUTPUT_DIR}/public-api-docs.html`)
    console.log(`  🛡️ Admin: open ${OUTPUT_DIR}/admin-api-docs.html`)
    console.log(`  🏪 Business: open ${OUTPUT_DIR}/business-api-docs.html`)
    console.log(`  🔧 Internal: open ${OUTPUT_DIR}/internal-api-docs.html`)
    console.log(`  📚 Complete: open ${OUTPUT_DIR}/all-apis-docs.html`)
  } catch (error) {
    console.error('❌ Error generating Scalar documentation:', error)
    process.exit(1)
  }
}

// Run generation
generateScalarDocs()
