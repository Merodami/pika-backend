import type {
  AdminTicketQueryParams,
  AdminUpdateProblemRequest,
} from '@pika/api/admin'
import type { ProblemIdParam } from '@pika/api/public'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ProblemMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IProblemService } from '../services/ProblemService.js'

/**
 * Handles admin problem management operations
 */
export class AdminProblemController {
  constructor(private readonly problemService: IProblemService) {
    // Bind all methods to preserve 'this' context
    this.getAllProblems = this.getAllProblems.bind(this)
    this.getProblemById = this.getProblemById.bind(this)
    this.updateProblem = this.updateProblem.bind(this)
    this.deleteProblem = this.deleteProblem.bind(this)
  }

  /**
   * GET /admin/problems
   * Get all support tickets with filtering
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problems',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllProblems(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<AdminTicketQueryParams>(request)

      // Transform API query to service params
      const problemParams = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        search: query.search,
        status: query.status,
        priority: query.priority,
        userId: query.userId,
      }

      const result = await this.problemService.getAllProblems(problemParams)

      // Transform to DTOs
      const dtoResult = {
        data: result.data.map(ProblemMapper.toDTO),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/problems/:id
   * Get support ticket by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problem',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProblemById(
    request: Request<ProblemIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      const problem = await this.problemService.getProblemById(id)

      if (!problem) {
        throw ErrorFactory.resourceNotFound('Problem', id)
      }

      // Transform to DTO
      const dto = ProblemMapper.toDTO(problem)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/problems/:id
   * Update support ticket
   */
  async updateProblem(
    request: Request<ProblemIdParam, {}, AdminUpdateProblemRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const requestData = request.body

      // Transform API request to service DTO
      const data = {
        ...requestData,
        resolvedAt: requestData.resolvedAt?.toISOString() || null,
      }

      const problem = await this.problemService.updateProblem(id, data)

      // Transform to DTO
      const dto = ProblemMapper.toDTO(problem)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/problems/:id
   * Delete support ticket
   */
  async deleteProblem(
    request: Request<ProblemIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      await this.problemService.deleteProblem(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
