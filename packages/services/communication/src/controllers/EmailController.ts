import type {
    CommunicationLogSearchParams as ApiCommunicationLogSearchParams,
    CommunicationLogIdParam,
    SendBulkEmailRequest,
    SendEmailRequest,
} from '@pika/api/public'
import { CommunicationLogMapper } from '@pika/sdk'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { logger } from '@pika/shared'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, RequestContext } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import type { CommunicationLogSearchParams } from '../repositories/CommunicationLogRepository.js'
import type {
    BulkEmailInput,
    IEmailService,
    SendEmailInput,
} from '../services/EmailService.js'

export interface IEmailController {
  sendEmail(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  sendBulkEmail(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getEmailHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getEmailById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
}

/**
 * Handles email communication operations
 */
export class EmailController implements IEmailController {
  constructor(private readonly emailService: IEmailService) {
    // Bind all methods to preserve 'this' context
    this.sendEmail = this.sendEmail.bind(this)
    this.sendBulkEmail = this.sendBulkEmail.bind(this)
    this.getEmailHistory = this.getEmailHistory.bind(this)
    this.getEmailById = this.getEmailById.bind(this)
  }

  /**
   * POST /email/send
   * Send an email to a single recipient
   */
  async sendEmail(
    request: Request<{}, {}, SendEmailRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Email send request', {
        to: data.to,
        templateId: data.templateId,
        userId,
      })

      // Transform API request to service input
      const emailInput: SendEmailInput = {
        to:
          typeof data.to === 'string'
            ? data.to
            : data.to.map((r) => r.email).join(','),
        subject: data.subject,
        templateId: data.templateId,
        templateParams: data.templateParams,
        body: data.body || data.textContent,
        isHtml: data.isHtml || !!data.htmlContent,
        userId,
      }

      const result = await this.emailService.sendEmail(emailInput)

      response.json(CommunicationLogMapper.toDTO(result))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /email/send-bulk
   * Send emails to multiple recipients
   */
  async sendBulkEmail(
    request: Request<{}, {}, SendBulkEmailRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Bulk email send request', {
        recipientCount: data.recipients.length,
        templateId: data.templateId,
        userId,
      })

      // Transform API request to service input
      const bulkEmailInput: BulkEmailInput = {
        to: data.recipients.map((r) => r.email),
        subject: data.subject,
        templateId: data.templateId,
        templateParams: data.globalVariables,
        userId,
      }

      const result = await this.emailService.sendBulkEmail(bulkEmailInput)

      response.status(201).json({
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        logs: result.logs.map(CommunicationLogMapper.toDTO),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /email/history
   * Get email communication history
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'email-history',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getEmailHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const query = getValidatedQuery<ApiCommunicationLogSearchParams>(request)

      // Transform API params to service params
      const params: CommunicationLogSearchParams = {
        page: query.page,
        limit: query.limit,
        status: query.status,
        recipient: query.recipient,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      }

      logger.info('Getting email history', { userId, params })

      const result = await this.emailService.getEmailHistory(userId, params)

      response.json({
        data: result.data.map(CommunicationLogMapper.toDTO),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /email/history/:id
   * Get specific email details by ID
   */
  async getEmailById(
    request: Request<CommunicationLogIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting email by ID', { id, userId })

      const email = await this.emailService.getEmailById(id, userId)

      response.json(CommunicationLogMapper.toDTO(email))
    } catch (error) {
      next(error)
    }
  }
}
