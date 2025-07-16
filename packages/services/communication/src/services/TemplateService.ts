import type { ICacheService } from '@pika/redis'
import type {
    CreateTemplateDTO,
    TemplateDomain,
    UpdateTemplateDTO,
} from '@pikadk'
import { Cache } from '@pikaedis'
import { ErrorFactory, logger } from '@pikahared'
import type { PaginatedResult } from '@pikaypes'
import Handlebars from 'handlebars'

import type {
    ITemplateRepository,
    TemplateSearchParams,
} from '../repositories/TemplateRepository.js'
import { EMAIL_TEMPLATES } from '../types/constants.js'

export interface ITemplateService {
  createTemplate(data: CreateTemplateDTO): Promise<TemplateDomain>
  getTemplateById(id: string): Promise<TemplateDomain>
  getTemplateByExternalId(externalId: string): Promise<TemplateDomain>
  getAllTemplates(
    params: TemplateSearchParams,
  ): Promise<PaginatedResult<TemplateDomain>>
  updateTemplate(id: string, data: UpdateTemplateDTO): Promise<TemplateDomain>
  deleteTemplate(id: string): Promise<void>
  validateTemplate(
    template: TemplateDomain,
    variables: Record<string, any>,
  ): Promise<boolean>
  compileTemplate(
    template: TemplateDomain,
    variables: Record<string, any>,
  ): Promise<string>
  seedDefaultTemplates(): Promise<void>
}

export class TemplateService implements ITemplateService {
  constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly cache: ICacheService,
  ) {}

  async createTemplate(data: CreateTemplateDTO): Promise<TemplateDomain> {
    logger.info('Creating template', { name: data.name, type: data.type })

    // Validate template syntax if HTML/text content provided
    if (data.metadata?.htmlTemplate) {
      try {
        Handlebars.compile(data.metadata.htmlTemplate)
      } catch (error) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid template syntax',
          `HTML template has invalid Handlebars syntax: ${error.message}`,
        )
      }
    }

    if (data.metadata?.textTemplate) {
      try {
        Handlebars.compile(data.metadata.textTemplate)
      } catch (error) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid template syntax',
          `Text template has invalid Handlebars syntax: ${error.message}`,
        )
      }
    }

    const template = await this.templateRepository.create(data)

    // Clear template cache
    await this.clearTemplateCache()

    return template
  }

  @Cache({
    ttl: 3600, // 1 hour cache for templates
    prefix: 'template',
  })
  async getTemplateById(id: string): Promise<TemplateDomain> {
    const template = await this.templateRepository.findById(id)

    if (!template) {
      throw ErrorFactory.resourceNotFound('Template', id)
    }

    return template
  }

  @Cache({
    ttl: 3600,
    prefix: 'template-external',
  })
  async getTemplateByExternalId(externalId: string): Promise<TemplateDomain> {
    const template = await this.templateRepository.findByExternalId(externalId)

    if (!template) {
      throw ErrorFactory.resourceNotFound('Template', `external:${externalId}`)
    }

    return template
  }

  @Cache({
    ttl: 300, // 5 minutes cache for template lists
    prefix: 'templates',
  })
  async getAllTemplates(
    params: TemplateSearchParams,
  ): Promise<PaginatedResult<TemplateDomain>> {
    return this.templateRepository.findAll(params)
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateDTO,
  ): Promise<TemplateDomain> {
    logger.info('Updating template', { id })

    // Validate template syntax if HTML/text content provided
    if (data.metadata?.htmlTemplate) {
      try {
        Handlebars.compile(data.metadata.htmlTemplate)
      } catch (error) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid template syntax',
          `HTML template has invalid Handlebars syntax: ${error.message}`,
        )
      }
    }

    if (data.metadata?.textTemplate) {
      try {
        Handlebars.compile(data.metadata.textTemplate)
      } catch (error) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid template syntax',
          `Text template has invalid Handlebars syntax: ${error.message}`,
        )
      }
    }

    const template = await this.templateRepository.update(id, data)

    // Clear template cache
    await this.clearTemplateCache()

    return template
  }

  async deleteTemplate(id: string): Promise<void> {
    logger.info('Deleting template', { id })

    await this.templateRepository.delete(id)

    // Clear template cache
    await this.clearTemplateCache()
  }

  async validateTemplate(
    template: TemplateDomain,
    variables: Record<string, any>,
  ): Promise<boolean> {
    try {
      // Check if all required variables are provided
      if (template.variables && Array.isArray(template.variables)) {
        for (const variable of template.variables) {
          if (variable.required && !(variable.name in variables)) {
            logger.warn('Missing required template variable', {
              templateId: template.id,
              variable: variable.name,
            })

            return false
          }
        }
      }

      // Try to compile the template
      if (template.metadata?.htmlTemplate) {
        const compiledHtml = Handlebars.compile(template.metadata.htmlTemplate)

        compiledHtml(variables)
      }

      if (template.metadata?.textTemplate) {
        const compiledText = Handlebars.compile(template.metadata.textTemplate)

        compiledText(variables)
      }

      return true
    } catch (error) {
      logger.error('Template validation failed', {
        templateId: template.id,
        error: error.message,
      })

      return false
    }
  }

  async compileTemplate(
    template: TemplateDomain,
    variables: Record<string, any>,
  ): Promise<string> {
    // Validate template first
    const isValid = await this.validateTemplate(template, variables)

    if (!isValid) {
      throw ErrorFactory.businessRuleViolation(
        'Template validation failed',
        'Template cannot be compiled with the provided variables',
      )
    }

    // Compile HTML template if available, otherwise use text
    if (template.metadata?.htmlTemplate) {
      const compiled = Handlebars.compile(template.metadata.htmlTemplate)

      return compiled(variables)
    } else if (template.metadata?.textTemplate) {
      const compiled = Handlebars.compile(template.metadata.textTemplate)

      return compiled(variables)
    } else {
      throw ErrorFactory.businessRuleViolation(
        'No template content',
        'Template has no HTML or text content to compile',
      )
    }
  }

  async seedDefaultTemplates(): Promise<void> {
    logger.info('Seeding default templates')

    const defaultTemplates: CreateTemplateDTO[] = [
      {
        name: 'Session Invitation',
        type: 'email',
        category: 'session',
        externalId: 'session-invitation',
        subject: 'You have been invited to a session',
        body: 'You have been invited to join a session at {{gymName}} on {{sessionDate}} at {{sessionTime}}. Use this link to join: {{inviteLink}}',
        description: 'Email sent when a user is invited to join a session',
        variables: [
          { name: 'inviterName', type: 'string', required: true },
          { name: 'sessionDate', type: 'string', required: true },
          { name: 'sessionTime', type: 'string', required: true },
          { name: 'gymName', type: 'string', required: true },
          { name: 'inviteLink', type: 'string', required: true },
        ],
        metadata: {
          htmlTemplate: `
            <h2>Session Invitation</h2>
            <p>Hi there!</p>
            <p>{{inviterName}} has invited you to join a session at Pika.</p>
            <p><strong>Session Details:</strong></p>
            <ul>
              <li>Date: {{sessionDate}}</li>
              <li>Time: {{sessionTime}}</li>
              <li>Location: {{gymName}}</li>
            </ul>
            <p><a href="{{inviteLink}}">Click here to respond to the invitation</a></p>
            <p>Best regards,<br>The Pika Team</p>
          `,
          textTemplate: `
Session Invitation

Hi there!

{{inviterName}} has invited you to join a session at Pika.

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{gymName}}

Click here to respond: {{inviteLink}}

Best regards,
The Pika Team
          `,
        },
        isActive: true,
      },
      {
        name: 'Field Street Noise Warning',
        type: 'email',
        category: 'session',
        externalId: EMAIL_TEMPLATES.FIELD_STREET_NOISE_WARNING,
        subject: 'Important: Noise Considerations at Field Street Gym',
        body: 'Hi {{userName}}, please be aware of noise considerations for your session on {{sessionDate}} at {{sessionTime}} at Field Street Gym.',
        description: 'Warning email about noise at Field Street gym location',
        variables: [
          { name: 'userName', type: 'string', required: true },
          { name: 'sessionDate', type: 'string', required: true },
          { name: 'sessionTime', type: 'string', required: true },
        ],
        metadata: {
          htmlTemplate: `
            <h2>Important Notice: Field Street Gym</h2>
            <p>Dear {{userName}},</p>
            <p>Thank you for booking a session at Field Street Gym on {{sessionDate}} at {{sessionTime}}.</p>
            <p><strong>Please note:</strong> This location may experience higher noise levels during peak hours. We recommend bringing noise-cancelling headphones if you're sensitive to sound.</p>
            <p>We appreciate your understanding and look forward to seeing you!</p>
            <p>Best regards,<br>The Pika Team</p>
          `,
          textTemplate: `
Important Notice: Field Street Gym

Dear {{userName}},

Thank you for booking a session at Field Street Gym on {{sessionDate}} at {{sessionTime}}.

Please note: This location may experience higher noise levels during peak hours. We recommend bringing noise-cancelling headphones if you're sensitive to sound.

We appreciate your understanding and look forward to seeing you!

Best regards,
The Pika Team
          `,
        },
        isActive: true,
      },
      {
        name: 'Induction Request',
        type: 'email',
        category: 'induction',
        externalId: EMAIL_TEMPLATES.INDUCTION_REQUEST,
        subject: 'New Induction Request',
        body: 'A new induction has been requested by {{userName}} at {{gymName}} on {{requestDate}}. Review at: {{adminLink}}',
        description: 'Notification to admin when a new induction is requested',
        variables: [
          { name: 'userName', type: 'string', required: true },
          { name: 'gymName', type: 'string', required: true },
          { name: 'requestDate', type: 'string', required: true },
          { name: 'adminLink', type: 'string', required: true },
        ],
        metadata: {
          htmlTemplate: `
            <h2>New Induction Request</h2>
            <p>A new induction has been requested:</p>
            <ul>
              <li><strong>User:</strong> {{userName}}</li>
              <li><strong>Gym:</strong> {{gymName}}</li>
              <li><strong>Request Date:</strong> {{requestDate}}</li>
            </ul>
            <p><a href="{{adminLink}}">View request in admin panel</a></p>
          `,
          textTemplate: `
New Induction Request

User: {{userName}}
Gym: {{gymName}}
Request Date: {{requestDate}}

View request: {{adminLink}}
          `,
        },
        isActive: true,
      },
      {
        name: 'Induction Status Update',
        type: 'email',
        category: 'induction',
        externalId: EMAIL_TEMPLATES.INDUCTION_STATUS,
        subject: 'Induction Status Update',
        body: 'Hi {{userName}}, your induction status at {{gymName}} has been updated to: {{status}}. {{message}}',
        description: 'Notification when induction status is updated',
        variables: [
          { name: 'userName', type: 'string', required: true },
          { name: 'gymName', type: 'string', required: true },
          { name: 'status', type: 'string', required: true },
          { name: 'message', type: 'string', required: false },
        ],
        metadata: {
          htmlTemplate: `
            <h2>Induction Status Update</h2>
            <p>Hi {{userName}},</p>
            <p>Your induction request for <strong>{{gymName}}</strong> has been <strong>{{status}}</strong>.</p>
            {{#if message}}
            <p>Message from admin: {{message}}</p>
            {{/if}}
            <p>Best regards,<br>The Pika Team</p>
          `,
          textTemplate: `
Induction Status Update

Hi {{userName}},

Your induction request for {{gymName}} has been {{status}}.

{{#if message}}
Message from admin: {{message}}
{{/if}}

Best regards,
The Pika Team
          `,
        },
        isActive: true,
      },
      {
        name: 'Professional Information Request',
        type: 'email',
        category: 'professional',
        externalId: EMAIL_TEMPLATES.PROFESSIONAL_REQUEST_INFO,
        subject: 'Information Request from Pika User',
        body: 'Hi {{professionalName}}, {{userName}} ({{userEmail}}) has requested information from you. Message: {{message}}',
        description: 'Email to professional when user requests information',
        variables: [
          { name: 'professionalName', type: 'string', required: true },
          { name: 'userName', type: 'string', required: true },
          { name: 'userEmail', type: 'string', required: true },
          { name: 'message', type: 'string', required: false },
        ],
        metadata: {
          htmlTemplate: `
            <h2>Information Request</h2>
            <p>Hi {{professionalName}},</p>
            <p>A Pika user has requested information about your services.</p>
            <p><strong>User Details:</strong></p>
            <ul>
              <li>Name: {{userName}}</li>
              <li>Email: {{userEmail}}</li>
            </ul>
            {{#if message}}
            <p><strong>Message:</strong><br>{{message}}</p>
            {{/if}}
            <p>Please respond directly to the user at their email address.</p>
            <p>Best regards,<br>The Pika Team</p>
          `,
          textTemplate: `
Information Request

Hi {{professionalName}},

A Pika user has requested information about your services.

User Details:
- Name: {{userName}}
- Email: {{userEmail}}

{{#if message}}
Message: {{message}}
{{/if}}

Please respond directly to the user at their email address.

Best regards,
The Pika Team
          `,
        },
        isActive: true,
      },
    ]

    // Create templates that don't exist
    for (const templateData of defaultTemplates) {
      try {
        const existing = await this.templateRepository.findByExternalId(
          templateData.externalId,
        )

        if (!existing) {
          await this.createTemplate(templateData)
          logger.info('Created default template', { name: templateData.name })
        }
      } catch (error) {
        logger.error('Failed to create default template', {
          name: templateData.name,
          error: error.message,
        })
      }
    }
  }

  private async clearTemplateCache(): Promise<void> {
    try {
      // Clear all template-related cache entries
      await this.cache.delPattern('template:*')
      await this.cache.delPattern('template-external:*')
      await this.cache.delPattern('templates:*')
    } catch (error) {
      logger.error('Failed to clear template cache', error)
    }
  }
}
