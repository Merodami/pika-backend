/**
 * Interface for fetching a specific category
 */
export interface GetCategoryQuery {
  id: string
  includeChildren?: boolean
}
