import SwaggerParser from '@apidevtools/swagger-parser'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { fileURLToPath } from 'url'

import { OpenAPISpec } from '../openapi.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Utility: resolve paths from project root
const fromRoot = (...args: string[]) => path.join(__dirname, '../..', ...args)

/**
 * Recursively remove any $id properties from an object.
 */
function removeIdProperties(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeIdProperties)
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {}

    for (const key of Object.keys(obj)) {
      if (key === '$id') {
        continue
      }

      // eslint-disable-next-line security/detect-object-injection
      newObj[key] = removeIdProperties(obj[key])
    }

    return newObj
  }

  return obj
}

/**
 * Recursively remove custom keywords from an object.
 * @param obj - The object (or schema) to clean.
 * @param keysToRemove - The keys to remove. Defaults to ['errorMessage'].
 */
function removeCustomKeywords(
  obj: any,
  keysToRemove: string[] = ['errorMessage'],
): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeCustomKeywords(item, keysToRemove))
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {}

    for (const key of Object.keys(obj)) {
      if (keysToRemove.includes(key)) continue

      // eslint-disable-next-line security/detect-object-injection
      newObj[key] = removeCustomKeywords(obj[key], keysToRemove)
    }

    return newObj
  }

  return obj
}

async function main() {
  try {
    console.log('Starting OpenAPI spec compilation...')

    // Clone the spec to avoid mutating the original
    console.log('Cloning OpenAPI spec...')

    const spec: OpenAPIV3.Document = cloneDeep(OpenAPISpec)

    // Remove $id properties from the spec so that it complies with OpenAPI
    console.log('Removing $id properties...')

    const cleanedSpec = removeIdProperties(spec)

    // Remove custom keywords (like errorMessage) that are not allowed by OpenAPI
    console.log('Removing custom keywords...')

    const docsSpec = removeCustomKeywords(cleanedSpec, ['errorMessage'])

    // Validate the cleaned OpenAPI spec (this also dereferences $refs)
    console.log('Validating OpenAPI spec...')
    try {
      await SwaggerParser.validate(docsSpec, {
        validate: { schema: true },
        dereference: { circular: 'ignore' },
      })
    } catch (error) {
      console.error('Validation error details:')
      if (error.path) console.error('Path:', error.path)
      if (error.params) console.error('Params:', error.params)
      if (error.$ref) console.error('$ref:', error.$ref)
      throw error
    }

    // Prepare the output directory (e.g. "dist")
    const outputDir = fromRoot('dist')

    console.log(`Ensuring output directory exists: ${outputDir}`)
    await fs.ensureDir(outputDir)

    // Allowed file paths - defined explicitly to avoid security/detect-non-literal-fs-filename
    const apiJsonFilename = 'openapi.json'
    const docsJsonFilename = 'openapi-docs.json'
    const htmlFilename = 'openapi.html'
    const templateFilename = fromRoot('src', 'docs-template.html')

    // Generate full paths
    const apiJsonFullPath = path.join(outputDir, apiJsonFilename)
    const docsJsonFullPath = path.join(outputDir, docsJsonFilename)
    const htmlFullPath = path.join(outputDir, htmlFilename)

    // Write the complete OpenAPI spec JSON (with all routes for API usage)
    console.log(`Writing API spec to: ${apiJsonFullPath}`)
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.writeFile(apiJsonFullPath, JSON.stringify(docsSpec, null, 2))

    // Write the filtered documentation OpenAPI spec JSON
    console.log(`Writing docs spec to: ${docsJsonFullPath}`)
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.writeFile(docsJsonFullPath, JSON.stringify(docsSpec, null, 2))

    // Optionally, generate HTML documentation.
    console.log(`Checking for template file: ${templateFilename}`)
    if (await fs.pathExists(templateFilename)) {
      console.log('Template file found, generating HTML documentation...')

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const template = await fs.readFile(templateFilename, 'utf8')

      // Replace placeholders in the template. Adjust placeholders as needed.
      const htmlOutput = template
        .replace('{{SPEC}}', JSON.stringify(docsSpec))
        .replace('{{TITLE}}', docsSpec.info.title)

      console.log(`Writing HTML documentation to: ${htmlFullPath}`)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.writeFile(htmlFullPath, htmlOutput)
    } else {
      console.log(
        'Template file not found, skipping HTML documentation generation',
      )
    }

    console.log('OpenAPI spec compilation completed successfully!')
  } catch (error) {
    console.error('Error during OpenAPI spec compilation:')
    console.error(error)
    process.exit(1)
  }
}

main()
