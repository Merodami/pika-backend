/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Update ticket status
 */
export type UpdateTicketStatusRequest = {
  status:
    | 'OPEN'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_CUSTOMER'
    | 'WAITING_INTERNAL'
    | 'RESOLVED'
    | 'CLOSED'
  note?: string
  notifyUser?: boolean
}
