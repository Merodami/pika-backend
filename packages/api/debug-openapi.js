import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../../.env') })
config({ path: join(__dirname, '../../.env.local'), override: true })

// Suppress environment warnings
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('environment variable') || args[0]?.includes?.('Using fallback')) {
    return
  }
  originalConsoleWarn(...args)
}

async function debugGenerateOpenAPI() {
  try {
    console.log('Loading admin API generator...')
    const adminModule = await import('./src/scripts/generators/admin-api.js')
    console.log('Loaded admin API successfully')
    
    console.log('\nLoading public API generator...')
    const publicModule = await import('./src/scripts/generators/public-api.js')
    console.log('Loaded public API successfully')
    
    console.log('\nLoading internal API generator...')
    const internalModule = await import('./src/scripts/generators/internal-api.js')
    console.log('Loaded internal API successfully')
    
    console.log('\nGenerating admin OpenAPI...')
    const adminDoc = await adminModule.generateAdminOpenAPI()
    console.log('Generated admin OpenAPI successfully')
    
    console.log('\nGenerating public OpenAPI...')
    const publicDoc = await publicModule.generatePublicOpenAPI()
    console.log('Generated public OpenAPI successfully')
    
    console.log('\nGenerating internal OpenAPI...')
    const internalDoc = await internalModule.generateInternalOpenAPI()
    console.log('Generated internal OpenAPI successfully')
    
    console.log('\nAll OpenAPI documents generated successfully!')
  } catch (error) {
    console.error('\nError occurred:')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    // Try to identify which generator failed
    if (error.stack?.includes('admin-api')) {
      console.error('\nError in admin API generator')
    } else if (error.stack?.includes('public-api')) {
      console.error('\nError in public API generator')
    } else if (error.stack?.includes('internal-api')) {
      console.error('\nError in internal API generator')
    }
    
    process.exit(1)
  }
}

debugGenerateOpenAPI()