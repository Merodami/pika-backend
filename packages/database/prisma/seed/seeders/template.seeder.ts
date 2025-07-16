/**
 * Template seeder - Creates session templates
 */

import { PrismaClient, User } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import { generateTemplateData } from '../data/template.data.js'
import { logger } from '../utils/logger.js'

export async function seedTemplates(
  prisma: PrismaClient,
  professionals: User[]
): Promise<void> {
  const config = getSeedConfig()

  logger.info('Creating session templates...')

  for (const _ of professionals) {
    const templateCount = config.templatesPerProfessional

    for (let i = 0; i < templateCount; i++) {
      try {
        const templateData = generateTemplateData(i)

        await prisma.template.create({
          data: templateData,
        })
      } catch (error) {
        logger.error('Failed to create template:', error)
      }
    }
  }

  logger.success('✅ Created templates')
}