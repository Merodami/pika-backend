import {
  type ReviewCreateDTO,
  type ReviewResponseDTO,
  type ReviewUpdateDTO,
} from '@review-write/domain/dtos/ReviewDTO.js'
import { type Review } from '@review-write/domain/entities/Review.js'

export interface ReviewWriteRepositoryPort {
  createReview(dto: ReviewCreateDTO): Promise<Review>
  updateReview(id: string, dto: ReviewUpdateDTO): Promise<Review>
  deleteReview(id: string, dto: { _requestingUserId: string }): Promise<void>
  addProviderResponse(id: string, dto: ReviewResponseDTO): Promise<Review>
}
