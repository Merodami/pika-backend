import { NODE_ENV } from '@pika/environment'
import { type Request, type Response, Router } from 'express'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if running in production environment
const isProduction = NODE_ENV === 'production'

/**
 * Create documentation routes
 */
export function createDocsRouter(): Router {
  const router = Router()

  // Helper function to serve documentation files
  const serveDocFile = async (
    filename: string,
    res: Response,
  ): Promise<void> => {
    try {
      // Look for docs in the @pika/api package dist folder
      const apiPackagePath = join(__dirname, '../../../../api/dist')
      const docPath = join(apiPackagePath, filename)

      if (!existsSync(docPath)) {
        res.status(404).json({
          error: 'Documentation not found',
          message:
            'Please run "yarn generate:docs" in the api package to generate documentation',
        })

        return
      }

      const content = await readFile(docPath, 'utf-8')

      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(content)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load documentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Main documentation index
  router.get('/', async (req: Request, res: Response) => {
    await serveDocFile('api-docs-index.html', res)
  })

  // Individual API documentation
  router.get('/public', async (_req: Request, res: Response) => {
    await serveDocFile('public-api-docs.html', res)
  })

  // Admin documentation - only available in development
  router.get('/admin', async (_req: Request, res: Response) => {
    if (isProduction) {
      res.status(404).json({
        error: 'Not Found',
        message:
          'This documentation is not available in production environments',
      })

      return
    }
    await serveDocFile('admin-api-docs.html', res)
  })

  // Internal documentation - only available in development
  router.get('/internal', async (_req: Request, res: Response) => {
    if (isProduction) {
      res.status(404).json({
        error: 'Not Found',
        message:
          'This documentation is not available in production environments',
      })

      return
    }
    await serveDocFile('internal-api-docs.html', res)
  })

  // All APIs documentation - only available in development
  router.get('/all', async (_req: Request, res: Response) => {
    if (isProduction) {
      res.status(404).json({
        error: 'Not Found',
        message:
          'This documentation is not available in production environments',
      })

      return
    }
    await serveDocFile('all-apis-docs.html', res)
  })

  // Serve OpenAPI JSON files
  router.get('/openapi/:api', async (req: Request, res: Response) => {
    const apiName = req.params.api.replace('.json', '')
    const validApis = ['public-api', 'admin-api', 'internal-api', 'all-apis']

    if (!validApis.includes(apiName)) {
      res.status(404).json({ error: 'Invalid API specification' })

      return
    }

    try {
      const apiPackagePath = join(
        __dirname,
        '../../../../api/generated/openapi',
      )
      const specPath = join(apiPackagePath, `${apiName}.json`)

      if (!existsSync(specPath)) {
        res.status(404).json({
          error: 'OpenAPI specification not found',
          message: 'Please run "yarn generate:openapi" in the api package',
        })

        return
      }

      const content = await readFile(specPath, 'utf-8')

      res.setHeader('Content-Type', 'application/json')
      res.send(content)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load OpenAPI specification',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  return router
}
