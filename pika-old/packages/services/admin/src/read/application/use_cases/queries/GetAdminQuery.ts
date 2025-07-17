/**
 * Get Admin Query
 * Used to retrieve a specific admin by ID
 */
export interface GetAdminQuery {
  id: string
  includePermissions?: boolean
}
