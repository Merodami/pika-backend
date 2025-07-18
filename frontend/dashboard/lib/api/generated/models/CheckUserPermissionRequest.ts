/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Check user permission
 */
export type CheckUserPermissionRequest = {
  userId: string
  resource: string
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
  resourceId?: string
}
