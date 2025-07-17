/**
 * Interface for fetching a specific user
 */
export interface GetUserQuery {
  id: string
  includeAddresses?: boolean
  includePaymentMethods?: boolean
  includeCustomerProfile?: boolean
  includeProviderProfile?: boolean
}
