/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupportCommentSearchParams = {
  /**
   * Page number
   */
  page?: number
  /**
   * Items per page
   */
  limit?: number
  sortBy?: 'CREATED_AT' | 'UPDATED_AT'
  sortOrder?: 'asc' | 'desc'
  /**
   * Comma-separated relations:
   */
  include?: string
  search?: string
}
