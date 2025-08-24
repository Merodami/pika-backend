import { FRONTEND_URL } from '@pika/environment'
import { logger } from '@pika/shared'
import { EmailTemplateKey, TemplateCategory } from '@pika/types'
import fs from 'fs/promises'
import Handlebars from 'handlebars'
import { get, has } from 'lodash-es'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Type alias for backward compatibility
 * @deprecated Use EmailTemplateKey from @pika/types instead
 */
export type TemplateKey = EmailTemplateKey

/**
 * Template metadata
 */
export interface TemplateMetadata {
  key: EmailTemplateKey
  category: TemplateCategory
  filePath: string
  subject: string
  description: string
  requiredVariables: string[]
  optionalVariables?: string[]
}

/**
 * Compiled template with content
 */
export interface CompiledTemplate {
  metadata: TemplateMetadata
  subjectTemplate: HandlebarsTemplateDelegate
  bodyTemplate: HandlebarsTemplateDelegate
}

/**
 * Template registry mapping template keys to file paths and metadata
 */
export const TEMPLATE_REGISTRY: Record<EmailTemplateKey, TemplateMetadata> = {
  [EmailTemplateKey.EMAIL_VERIFICATION]: {
    key: EmailTemplateKey.EMAIL_VERIFICATION,
    category: TemplateCategory.AUTH,
    filePath: 'auth/email-verification.hbs',
    subject: 'Verify your email address - The VoucherBook',
    description: 'Email verification for new user registration',
    requiredVariables: ['firstName', 'verificationUrl'],
    optionalVariables: ['frontendUrl'],
  },

  [EmailTemplateKey.PASSWORD_RESET]: {
    key: EmailTemplateKey.PASSWORD_RESET,
    category: TemplateCategory.AUTH,
    filePath: 'auth/password-reset.hbs',
    subject: 'Reset your password - The VoucherBook',
    description: 'Password reset instructions',
    requiredVariables: ['firstName', 'resetLink', 'expirationHours'],
  },

  [EmailTemplateKey.PASSWORD_RESET_CONFIRMATION]: {
    key: EmailTemplateKey.PASSWORD_RESET_CONFIRMATION,
    category: TemplateCategory.AUTH,
    filePath: 'auth/password-reset-confirmation.hbs',
    subject: 'Password reset confirmed - The VoucherBook',
    description: 'Password reset confirmation',
    requiredVariables: ['firstName'],
  },

  [EmailTemplateKey.WELCOME]: {
    key: EmailTemplateKey.WELCOME,
    category: TemplateCategory.AUTH,
    filePath: 'auth/welcome.hbs',
    subject: 'Welcome to The VoucherBook! Your account is ready',
    description: 'Welcome message after email verification',
    requiredVariables: ['firstName'],
    optionalVariables: ['frontendUrl'],
  },

  [EmailTemplateKey.WELCOME_SOCIAL]: {
    key: EmailTemplateKey.WELCOME_SOCIAL,
    category: TemplateCategory.AUTH,
    filePath: 'auth/welcome-social.hbs',
    subject: 'Welcome to The VoucherBook! Your account is ready',
    description: 'Welcome message for social authentication users',
    requiredVariables: ['firstName'],
    optionalVariables: ['provider', 'frontendUrl'],
  },

  [EmailTemplateKey.BOOKING_CONFIRMATION]: {
    key: EmailTemplateKey.BOOKING_CONFIRMATION,
    category: TemplateCategory.TRANSACTIONAL,
    filePath: 'booking/confirmation.hbs',
    subject: 'Voucher Purchased - {{voucherTitle}} from {{businessName}}',
    description: 'Voucher purchase confirmation notification',
    requiredVariables: [
      'firstName',
      'voucherTitle',
      'businessName',
      'purchaseDate',
      'expirationDate',
    ],
  },

  [EmailTemplateKey.BOOKING_REMINDER]: {
    key: EmailTemplateKey.BOOKING_REMINDER,
    category: TemplateCategory.TRANSACTIONAL,
    filePath: 'booking/reminder.hbs',
    subject: 'Reminder: {{voucherTitle}} expires soon',
    description: 'Voucher expiration reminder notification',
    requiredVariables: [
      'firstName',
      'voucherTitle',
      'businessName',
      'expirationDate',
      'daysRemaining',
    ],
  },

  [EmailTemplateKey.BOOKING_CANCELLED]: {
    key: EmailTemplateKey.BOOKING_CANCELLED,
    category: TemplateCategory.TRANSACTIONAL,
    filePath: 'booking/cancelled.hbs',
    subject: 'Voucher Cancelled - {{voucherTitle}} from {{businessName}}',
    description: 'Voucher cancellation notification',
    requiredVariables: [
      'firstName',
      'voucherTitle',
      'businessName',
      'purchaseDate',
      'cancellationReason',
    ],
  },

  [EmailTemplateKey.PAYMENT_SUCCESS]: {
    key: EmailTemplateKey.PAYMENT_SUCCESS,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/success.hbs',
    subject: 'Payment Confirmed - The VoucherBook',
    description: 'Payment success confirmation',
    requiredVariables: ['firstName', 'amount', 'transactionId'],
  },

  [EmailTemplateKey.PAYMENT_FAILED]: {
    key: EmailTemplateKey.PAYMENT_FAILED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/failed.hbs',
    subject: 'Payment Failed - The VoucherBook',
    description: 'Payment failure notification',
    requiredVariables: ['firstName', 'amount', 'failureReason'],
  },

  [EmailTemplateKey.SUBSCRIPTION_ACTIVATED]: {
    key: EmailTemplateKey.SUBSCRIPTION_ACTIVATED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-activated.hbs',
    subject: 'Subscription Activated - Welcome to The VoucherBook Pro!',
    description: 'Subscription activation confirmation',
    requiredVariables: ['firstName', 'planName', 'nextBillingDate'],
  },

  [EmailTemplateKey.SUBSCRIPTION_CANCELLED]: {
    key: EmailTemplateKey.SUBSCRIPTION_CANCELLED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-cancelled.hbs',
    subject: 'Your The VoucherBook subscription has been cancelled',
    description: 'Subscription cancellation confirmation',
    requiredVariables: ['firstName', 'planName', 'cancellationDate'],
  },

  [EmailTemplateKey.SUBSCRIPTION_EXPIRING]: {
    key: EmailTemplateKey.SUBSCRIPTION_EXPIRING,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-expiring.hbs',
    subject: 'Your The VoucherBook subscription expires soon',
    description: 'Subscription expiration warning',
    requiredVariables: ['firstName', 'planName', 'expirationDate'],
  },

  [EmailTemplateKey.SUBSCRIPTION_EXPIRED]: {
    key: EmailTemplateKey.SUBSCRIPTION_EXPIRED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-expired.hbs',
    subject: 'Your The VoucherBook subscription has expired',
    description: 'Subscription expired notification',
    requiredVariables: ['firstName', 'planName', 'renewalUrl'],
  },

  [EmailTemplateKey.ACCOUNT_BANNED]: {
    key: EmailTemplateKey.ACCOUNT_BANNED,
    category: TemplateCategory.SYSTEM,
    filePath: 'system/account-banned.hbs',
    subject: 'Account Suspended',
    description: 'Account suspension notification',
    requiredVariables: ['reason'],
    optionalVariables: ['duration'],
  },

  [EmailTemplateKey.ACCOUNT_UNBANNED]: {
    key: EmailTemplateKey.ACCOUNT_UNBANNED,
    category: TemplateCategory.SYSTEM,
    filePath: 'system/account-unbanned.hbs',
    subject: 'Account Reinstated',
    description: 'Account reinstatement notification',
    requiredVariables: ['reason'],
  },
}

/**
 * File-based template service
 * Loads and compiles Handlebars templates from the file system
 */
export class TemplateService {
  private readonly templatesPath: string
  private readonly templateCache = new Map<EmailTemplateKey, CompiledTemplate>()
  private layoutTemplate: HandlebarsTemplateDelegate | null = null

  constructor() {
    this.templatesPath = path.join(__dirname)
    this.registerHelpers()
  }

  /**
   * Register Handlebars helpers for common formatting
   */
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return ''

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date))
    })

    // Currency formatting helper
    Handlebars.registerHelper(
      'formatCurrency',
      (amount: number, currency = 'USD') => {
        if (typeof amount !== 'number') return ''

        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount / 100) // Assuming amount is in cents
      },
    )

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return ''

      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    })

    // Current year helper
    Handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear()
    })
  }

  /**
   * Load and compile a template by key
   */
  async getTemplate(templateKey: EmailTemplateKey): Promise<CompiledTemplate> {
    // Check cache first
    if (this.templateCache.has(templateKey)) {
      return this.templateCache.get(templateKey)!
    }

    const metadata = has(TEMPLATE_REGISTRY, templateKey)
      ? get(TEMPLATE_REGISTRY, templateKey)
      : undefined

    if (!metadata) {
      throw new Error(`Template not found: ${templateKey}`)
    }

    try {
      // Load template content - validate path is within templates directory
      const templatePath = path.resolve(this.templatesPath, metadata.filePath)
      const normalizedTemplatesPath = path.resolve(this.templatesPath)

      if (!templatePath.startsWith(normalizedTemplatesPath)) {
        throw new Error(`Invalid template path: ${metadata.filePath}`)
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const templateContent = await fs.readFile(templatePath, 'utf-8')

      // Load layout template if not already loaded
      if (!this.layoutTemplate) {
        const layoutPath = path.resolve(this.templatesPath, 'shared/layout.hbs')
        const normalizedLayoutTemplatesPath = path.resolve(this.templatesPath)

        if (!layoutPath.startsWith(normalizedLayoutTemplatesPath)) {
          throw new Error('Invalid layout template path')
        }

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const layoutContent = await fs.readFile(layoutPath, 'utf-8')

        this.layoutTemplate = Handlebars.compile(layoutContent)
      }

      // Compile templates
      const subjectTemplate = Handlebars.compile(metadata.subject)
      const bodyContentTemplate = Handlebars.compile(templateContent)

      // Create wrapper template that combines content with layout
      const bodyTemplate = (variables: any) => {
        const bodyContent = bodyContentTemplate(variables)

        return this.layoutTemplate!({
          ...variables,
          body: bodyContent,
          subject: metadata.subject,
          recipientEmail: variables.recipientEmail || variables.to,
          frontendUrl: variables.frontendUrl || FRONTEND_URL,
          unsubscribeUrl:
            variables.unsubscribeUrl || `${FRONTEND_URL}/unsubscribe`,
          currentYear: new Date().getFullYear(),
        })
      }

      const compiledTemplate: CompiledTemplate = {
        metadata,
        subjectTemplate,
        bodyTemplate,
      }

      // Cache the compiled template
      this.templateCache.set(templateKey, compiledTemplate)

      logger.info('Template compiled and cached', {
        templateKey,
        filePath: metadata.filePath,
      })

      return compiledTemplate
    } catch (error) {
      logger.error('Failed to load template', error, {
        templateKey,
        filePath: metadata.filePath,
      })
      throw new Error(
        `Failed to load template ${templateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateKey: EmailTemplateKey,
    variables: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(templateKey)

    // Validate required variables
    const missingVariables = template.metadata.requiredVariables.filter(
      (variable) =>
        !has(variables, variable) ||
        get(variables, variable) === undefined ||
        get(variables, variable) === null,
    )

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables for template ${templateKey}: ${missingVariables.join(', ')}`,
      )
    }

    try {
      const subject = template.subjectTemplate(variables)
      const body = template.bodyTemplate(variables)

      return { subject, body }
    } catch (error) {
      logger.error('Failed to render template', error, {
        templateKey,
        variables: Object.keys(variables),
      })
      throw new Error(
        `Failed to render template ${templateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateMetadata[] {
    return Object.values(TEMPLATE_REGISTRY)
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): TemplateMetadata[] {
    return Object.values(TEMPLATE_REGISTRY).filter(
      (template) => template.category === category,
    )
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear()
    this.layoutTemplate = null
    logger.info('Template cache cleared')
  }

  /**
   * Validate template variables without rendering
   */
  validateTemplateVariables(
    templateKey: EmailTemplateKey,
    variables: Record<string, unknown>,
  ): { valid: boolean; missingVariables: string[] } {
    const metadata = has(TEMPLATE_REGISTRY, templateKey)
      ? get(TEMPLATE_REGISTRY, templateKey)
      : undefined

    if (!metadata) {
      throw new Error(`Template not found: ${templateKey}`)
    }

    const missingVariables = metadata.requiredVariables.filter(
      (variable) =>
        !has(variables, variable) ||
        get(variables, variable) === undefined ||
        get(variables, variable) === null,
    )

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    }
  }
}
