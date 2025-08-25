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
 * Create documentation routes - JSON only
 */
export function createDocsRouter(): Router {
  const router = Router()

  // Serve OpenAPI JSON files at /api/v1/docs/[api].json
  router.get('/:api.json', async (req: Request, res: Response) => {
    const apiName = req.params.api

    // In production, only allow public-api
    // In development, allow all APIs
    const validApis = isProduction
      ? ['public-api']
      : ['public-api', 'admin-api', 'internal-api', 'all-apis']

    if (!validApis.includes(apiName)) {
      res.status(404).json({ error: 'Invalid API specification' })

      return
    }

    try {
      // Look for OpenAPI specs in api-gateway dist/docs/openapi folder
      const specPath = join(
        __dirname,
        '../../../dist/docs/openapi',
        `${apiName}.json`,
      )

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
