import type {
    AdminTicketDetailResponse,
    AdminTicketListResponse,
    AdminTicketQueryParams,
    AssignTicketRequest,
    TicketIdParam,
    UpdateTicketStatusRequest,
} from '@pika/api/admin'
import type { ProblemDomain } from '@pika/sdk'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
import { ADMIN_PROBLEM_RELATIONS } from '@pika/api/admin'
import { getValidatedQuery } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import type { IProblemService } from '../services/ProblemService.js'

/**
 * Handles admin support ticket operations
 */
export class AdminSupportController {
  constructor(private readonly problemService: IProblemService) {
    // Bind methods to preserve 'this' context
    this.getAllTickets = this.getAllTickets.bind(this)
    this.getTicketById = this.getTicketById.bind(this)
    this.updateTicketStatus = this.updateTicketStatus.bind(this)
    this.assignTicket = this.assignTicket.bind(this)
  }

  /**
   * Transform ProblemDomain to AdminTicketDetailResponse
   */
  private toAdminTicketResponse(
    problem: ProblemDomain,
  ): AdminTicketDetailResponse {
    return {
      id: problem.id as any,
      ticketNumber: problem.ticketNumber || undefined,
      userId: problem.userId as any,
      userName: problem.user
        ? `${problem.user.firstName} ${problem.user.lastName}`
        : '',
      userEmail: problem.user?.email || '',
      title: problem.title,
      description: problem.description,
      type: problem.type as any,
      status: problem.status as any,
      priority: problem.priority as any,
      resolvedAt: problem.resolvedAt || undefined,
      assignedTo: (problem.assignedTo as any) || undefined,
      assignedToName: problem.assignedUser
        ? `${problem.assignedUser.firstName} ${problem.assignedUser.lastName}`
        : undefined,
      files: problem.files,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt || new Date(),
    }
  }

  /**
   * GET /admin/support/tickets
   * List all support tickets with filtering
   */
  async getAllTickets(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = getValidatedQuery<AdminTicketQueryParams>(req)

      // Parse include parameter
      const parsedIncludes = parseIncludeParam(
        params.include,
        ADMIN_PROBLEM_RELATIONS as unknown as string[],
      )

      const result = await this.problemService.searchProblems({
        search: params.search,
        ticketNumber: params.ticketNumber,
        userId: params.userId,
        assignedTo: params.assignedTo,
        status: params.status,
        priority: params.priority,
        type: params.type,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        parsedIncludes,
      })

      // Map to admin response format
      const response: AdminTicketListResponse = {
        data: result.data.map((problem) => this.toAdminTicketResponse(problem)),
        pagination: result.pagination,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/support/tickets/:id
   * Get single ticket details
   */
  async getTicketById(
    req: Request<TicketIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      // Parse include parameter
      const query = getValidatedQuery<{ include?: string }>(req)
      const parsedIncludes = parseIncludeParam(
        query.include,
        ADMIN_PROBLEM_RELATIONS as unknown as string[],
      )

      const problem = await this.problemService.getProblemById(
        id,
        parsedIncludes,
      )

      if (!problem) {
        throw ErrorFactory.resourceNotFound('Ticket', id)
      }

      const response = this.toAdminTicketResponse(problem)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/support/tickets/:id/status
   * Update ticket status
   */
  async updateTicketStatus(
    req: Request<TicketIdParam, {}, UpdateTicketStatusRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      const updated = await this.problemService.updateProblem(id, { status })
      const response = this.toAdminTicketResponse(updated)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/support/tickets/:id/assign
   * Assign ticket to admin user
   */
  async assignTicket(
    req: Request<TicketIdParam, {}, AssignTicketRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { assigneeId, priority } = req.body

      const updates: any = { assignedTo: assigneeId }

      if (priority) {
        updates.priority = priority
      }

      const updated = await this.problemService.updateProblem(id, updates)
      const response = this.toAdminTicketResponse(updated)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
