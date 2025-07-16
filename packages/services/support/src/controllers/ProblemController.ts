import type { CreateSupportProblemRequest } from '@pika/api/public'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ProblemMapper } from '@pika/sdk'
import type { NextFunction, Request, Response } from 'express'

import type { IProblemService } from '../services/ProblemService.js'

/**
 * Handles user support ticket operations
 */
export class ProblemController {
  constructor(private readonly problemService: IProblemService) {
    // Bind all methods to preserve 'this' context
    this.getUserProblems = this.getUserProblems.bind(this)
    this.createProblem = this.createProblem.bind(this)
  }

  /**
   * GET /problems/my-tickets
   * Get authenticated user's support tickets
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user-problems',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserProblems(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated user for security
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const problems = await this.problemService.getProblemsByUserId(userId)

      // Transform to DTOs
      const dtos = problems.map(ProblemMapper.toDTO)

      response.json({ data: dtos })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /problems
   * Create new support ticket
   */
  async createProblem(
    request: Request<{}, {}, CreateSupportProblemRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated user instead of body.userId for security
      const context = RequestContext.getContext(request)
      const data = {
        ...request.body,
        userId: context.userId, // Override any userId from body
      }

      const problem = await this.problemService.createProblem(data)

      // Transform to DTO
      const dto = ProblemMapper.toDTO(problem)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }
}
