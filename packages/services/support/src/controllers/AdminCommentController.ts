import {
  ADMIN_COMMENT_RELATIONS,
  AdminCommentsByProblemQuery,
  AdminGetAllCommentsQuery,
} from '@pika/api/admin'
import { SupportCommentMapper } from '@pika/sdk'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { parseIncludeParam } from '@pika/shared'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import type {
  CreateSupportCommentRequest,
  ProblemIdForCommentsParam,
  SupportCommentIdParam,
  UpdateSupportCommentRequest,
} from '@pika/api/public'
import { getValidatedQuery, RequestContext } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import type { IAdminSupportCommentService } from '../services/AdminSupportCommentService.js'

/**
 * Handles admin comment management operations
 */
export class AdminCommentController {
  constructor(
    private readonly adminCommentService: IAdminSupportCommentService,
  ) {
    // Bind all methods to preserve 'this' context
    this.getAllComments = this.getAllComments.bind(this)
    this.getCommentsByProblemId = this.getCommentsByProblemId.bind(this)
    this.createInternalComment = this.createInternalComment.bind(this)
    this.updateAnyComment = this.updateAnyComment.bind(this)
    this.deleteAnyComment = this.deleteAnyComment.bind(this)
  }

  /**
   * GET /admin/comments
   * Get all comments with filtering (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-comments',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllComments(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate query parameters
      const query = getValidatedQuery<AdminGetAllCommentsQuery>(request)

      // Parse include query parameter
      const parsedIncludes = parseIncludeParam(
        query.include,
        ADMIN_COMMENT_RELATIONS as unknown as string[],
      )

      const comments =
        await this.adminCommentService.getAllComments(parsedIncludes)

      // Transform to DTOs
      const dtos = comments.map(SupportCommentMapper.toDTO)

      response.json({ data: dtos })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/comments/problem/:problemId
   * Get all comments for a problem (including internal notes)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problem-comments',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCommentsByProblemId(
    request: Request<
      ProblemIdForCommentsParam,
      {},
      {},
      AdminCommentsByProblemQuery
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { problemId } = request.params

      // Validate query parameters
      const query = getValidatedQuery<AdminCommentsByProblemQuery>(request)

      // Parse include query parameter
      const parsedIncludes = parseIncludeParam(
        query.include,
        ADMIN_COMMENT_RELATIONS as unknown as string[],
      )

      const comments = await this.adminCommentService.getCommentsByProblemId(
        problemId,
        parsedIncludes,
      )

      // Transform to DTOs
      const dtos = comments.map(SupportCommentMapper.toDTO)

      response.json({ data: dtos })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/comments
   * Create internal comment/note (admin only)
   */
  async createInternalComment(
    request: Request<
      {},
      {},
      CreateSupportCommentRequest & { isInternal?: boolean }
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated admin user
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const commentData = {
        ...request.body,
        isInternal: request.body.isInternal ?? true, // Default to internal for admin comments
      }

      const comment = await this.adminCommentService.createInternalComment(
        userId,
        commentData,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/comments/:id
   * Update any comment (admin only)
   */
  async updateAnyComment(
    request: Request<SupportCommentIdParam, {}, UpdateSupportCommentRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      // Admin can update any comment
      const comment = await this.adminCommentService.updateAnyComment(
        id,
        request.body,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/comments/:id
   * Delete any comment (admin only)
   */
  async deleteAnyComment(
    request: Request<SupportCommentIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      // Admin can delete any comment
      await this.adminCommentService.deleteAnyComment(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
