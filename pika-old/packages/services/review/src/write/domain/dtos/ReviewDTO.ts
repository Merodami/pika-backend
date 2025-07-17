// Review DTOs for write operations

export type ReviewCreateDTO = {
  providerId: string
  rating: number
  review?: string
  customerId?: string // Will be set by command handler from context
}

export type ReviewUpdateDTO = {
  rating?: number
  review?: string
  _requestingUserId?: string // Internal field for authorization
}

export type ReviewResponseDTO = {
  response: string
  _providerId?: string // Internal field for authorization
}
