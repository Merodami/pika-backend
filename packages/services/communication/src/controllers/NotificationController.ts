import type {
  NotificationSearchParams as ApiNotificationSearchParams,
  CreateNotificationRequest,
  NotificationIdParam,
  UpdateNotificationStatusRequest,
} from '@pika/api/public'
import { NotificationMapper } from '@pika/sdk'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { logger } from '@pika/shared'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, RequestContext } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import type { NotificationSearchParams } from '../repositories/NotificationRepository.js'
import type { INotificationService } from '../services/NotificationService.js'

export interface INotificationController {
  /**
   * POST /notifications
   * Create a new notification
   */
  createNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getNotifications(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getNotificationById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  updateNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  markAsRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  markAllAsRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  deleteNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  createGlobalNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
}

/**
 * Handles in-app notification operations
 */
export class NotificationController implements INotificationController {
  constructor(private readonly notificationService: INotificationService) {
    // Bind all methods to preserve 'this' context
    this.createNotification = this.createNotification.bind(this)
    this.getNotifications = this.getNotifications.bind(this)
    this.getNotificationById = this.getNotificationById.bind(this)
    this.updateNotification = this.updateNotification.bind(this)
    this.markAsRead = this.markAsRead.bind(this)
    this.markAllAsRead = this.markAllAsRead.bind(this)
    this.deleteNotification = this.deleteNotification.bind(this)
    this.createGlobalNotification = this.createGlobalNotification.bind(this)
  }

  /**
   * POST /notifications
   * Create a new notification
   */
  async createNotification(
    request: Request<{}, {}, CreateNotificationRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Creating notification', {
        userId,
        type: data.type,
      })

      const notification = await this.notificationService.createNotification({
        ...data,
        userId: data.userId || userId,
      })

      response.json(NotificationMapper.toDTO(notification))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /notifications
   * Get user's notifications
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'notifications',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getNotifications(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const query = getValidatedQuery<ApiNotificationSearchParams>(request)

      // Transform API params to service params
      const params: NotificationSearchParams = {
        page: query.page,
        limit: query.limit,
        type: query.type,
        isRead: query.isRead,
      }

      logger.info('Getting notifications', { userId, params })

      const result = await this.notificationService.getUserNotifications(
        userId,
        params,
      )

      response.json({
        data: result.data.map(NotificationMapper.toDTO),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /notifications/:id
   * Get notification by ID
   */
  async getNotificationById(
    request: Request<NotificationIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting notification by ID', { id, userId })

      const notification = await this.notificationService.getNotificationById(
        id,
        userId,
      )

      response.json(NotificationMapper.toDTO(notification))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/:id
   * Update notification status
   */
  async updateNotification(
    request: Request<NotificationIdParam, {}, UpdateNotificationStatusRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Updating notification', { id, userId })

      const notification = await this.notificationService.updateNotification(
        id,
        data,
        userId,
      )

      response.json(NotificationMapper.toDTO(notification))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(
    request: Request<NotificationIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Marking notification as read', { id, userId })

      const notification = await this.notificationService.markAsRead(id, userId)

      response.json(NotificationMapper.toDTO(notification))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Marking all notifications as read', { userId })

      await this.notificationService.markAllAsRead(userId)

      response.json({ message: 'All notifications marked as read' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  async deleteNotification(
    request: Request<NotificationIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Deleting notification', { id, userId })

      await this.notificationService.deleteNotification(id, userId)

      response.json({ message: 'Notification deleted successfully' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /notifications/global
   * Create a global notification for all users
   */
  async createGlobalNotification(
    request: Request<{}, {}, CreateNotificationRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Creating global notification', { type: data.type })

      const notification =
        await this.notificationService.createGlobalNotification(data)

      response.json(NotificationMapper.toDTO(notification))
    } catch (error) {
      next(error)
    }
  }
}
