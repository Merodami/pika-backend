/**
 * Query object for retrieving a single review
 */
export interface GetReviewQuery {
  id: string
  includeRelations?: boolean
  correlationId?: string
}
