/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class SupportService {
  /**
   * Create a new support problem
   * @returns any Problem created successfully
   * @throws ApiError
   */
  public static postProblems({
    requestBody,
  }: {
    requestBody?: {
      title: string
      description: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
      type?:
        | 'BILLING'
        | 'TECHNICAL'
        | 'ACCOUNT'
        | 'GENERAL'
        | 'BUG_REPORT'
        | 'FEATURE_REQUEST'
      files?: Array<string>
    }
  }): CancelablePromise<{
    /**
     * Universally Unique Identifier
     */
    id: string
    ticketNumber?: string
    userId: string
    title: string
    description: string
    status:
      | 'OPEN'
      | 'ASSIGNED'
      | 'IN_PROGRESS'
      | 'WAITING_CUSTOMER'
      | 'WAITING_INTERNAL'
      | 'RESOLVED'
      | 'CLOSED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
    type:
      | 'BILLING'
      | 'TECHNICAL'
      | 'ACCOUNT'
      | 'GENERAL'
      | 'BUG_REPORT'
      | 'FEATURE_REQUEST'
    /**
     * ISO 8601 datetime with timezone
     */
    resolvedAt?: string
    assignedTo?: string
    files?: Array<string>
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/problems',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
  /**
   * Get user's support problems
   * @returns any List of user's problems
   * @throws ApiError
   */
  public static getProblems({
    search,
    status,
    priority,
    type,
    page = 1,
    limit = 20,
    sortBy = 'CREATED_AT',
    sortOrder = 'desc',
  }: {
    search?: string
    status?:
      | 'OPEN'
      | 'ASSIGNED'
      | 'IN_PROGRESS'
      | 'WAITING_CUSTOMER'
      | 'WAITING_INTERNAL'
      | 'RESOLVED'
      | 'CLOSED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
    type?:
      | 'BILLING'
      | 'TECHNICAL'
      | 'ACCOUNT'
      | 'GENERAL'
      | 'BUG_REPORT'
      | 'FEATURE_REQUEST'
    page?: number
    limit?: number
    sortBy?: 'CREATED_AT' | 'UPDATED_AT' | 'PRIORITY' | 'STATUS'
    sortOrder?: 'asc' | 'desc'
  }): CancelablePromise<{
    /**
     * Page items
     */
    data: Array<{
      /**
       * Universally Unique Identifier
       */
      id: string
      ticketNumber?: string
      userId: string
      title: string
      description: string
      status:
        | 'OPEN'
        | 'ASSIGNED'
        | 'IN_PROGRESS'
        | 'WAITING_CUSTOMER'
        | 'WAITING_INTERNAL'
        | 'RESOLVED'
        | 'CLOSED'
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
      type:
        | 'BILLING'
        | 'TECHNICAL'
        | 'ACCOUNT'
        | 'GENERAL'
        | 'BUG_REPORT'
        | 'FEATURE_REQUEST'
      /**
       * ISO 8601 datetime with timezone
       */
      resolvedAt?: string
      assignedTo?: string
      files?: Array<string>
      /**
       * When the record was created
       */
      createdAt: string
      /**
       * When the record was last updated
       */
      updatedAt: string
    }>
    /**
     * Pagination information
     */
    pagination: {
      /**
       * Current page number
       */
      page: number
      /**
       * Items per page
       */
      limit: number
      /**
       * Total number of items
       */
      total: number
      /**
       * Total number of pages
       */
      totalPages: number
      /**
       * Whether there is a next page
       */
      hasNext: boolean
      /**
       * Whether there is a previous page
       */
      hasPrev: boolean
    }
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/problems',
      query: {
        search: search,
        status: status,
        priority: priority,
        type: type,
        page: page,
        limit: limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
      },
    })
  }
  /**
   * Create a new comment
   * @returns any Comment created successfully
   * @throws ApiError
   */
  public static postComments({
    requestBody,
  }: {
    requestBody?: {
      /**
       * Universally Unique Identifier
       */
      problemId: string
      content: string
    }
  }): CancelablePromise<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * Universally Unique Identifier
     */
    problemId: string
    userId: string
    content: string
    isInternal?: boolean
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/comments',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
  /**
   * Get comments for a problem
   * @returns any List of comments
   * @throws ApiError
   */
  public static getCommentsProblem({
    problemId,
  }: {
    /**
     * Universally Unique Identifier
     */
    problemId: string
  }): CancelablePromise<{
    /**
     * Page items
     */
    data: Array<{
      /**
       * Universally Unique Identifier
       */
      id: string
      /**
       * Universally Unique Identifier
       */
      problemId: string
      userId: string
      content: string
      isInternal?: boolean
      /**
       * When the record was created
       */
      createdAt: string
      /**
       * When the record was last updated
       */
      updatedAt: string
    }>
    /**
     * Pagination information
     */
    pagination: {
      /**
       * Current page number
       */
      page: number
      /**
       * Items per page
       */
      limit: number
      /**
       * Total number of items
       */
      total: number
      /**
       * Total number of pages
       */
      totalPages: number
      /**
       * Whether there is a next page
       */
      hasNext: boolean
      /**
       * Whether there is a previous page
       */
      hasPrev: boolean
    }
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/comments/problem/{problemId}',
      path: {
        problemId: problemId,
      },
    })
  }
  /**
   * Get comment by ID
   * @returns any Comment details
   * @throws ApiError
   */
  public static getComments({
    id,
  }: {
    /**
     * Universally Unique Identifier
     */
    id: string
  }): CancelablePromise<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * Universally Unique Identifier
     */
    problemId: string
    userId: string
    content: string
    isInternal?: boolean
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/comments/{id}',
      path: {
        id: id,
      },
    })
  }
  /**
   * Update comment
   * @returns any Comment updated successfully
   * @throws ApiError
   */
  public static putComments({
    id,
    requestBody,
  }: {
    /**
     * Universally Unique Identifier
     */
    id: string
    requestBody?: {
      content: string
    }
  }): CancelablePromise<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * Universally Unique Identifier
     */
    problemId: string
    userId: string
    content: string
    isInternal?: boolean
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/comments/{id}',
      path: {
        id: id,
      },
      body: requestBody,
      mediaType: 'application/json',
    })
  }
  /**
   * Delete comment
   * @returns void
   * @throws ApiError
   */
  public static deleteComments({
    id,
  }: {
    /**
     * Universally Unique Identifier
     */
    id: string
  }): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/comments/{id}',
      path: {
        id: id,
      },
    })
  }
}
