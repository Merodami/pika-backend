import type { Prisma } from '@pika/database'
import { v4 as uuidv4 } from 'uuid'

/**
 * Creates a basic review fixture for testing
 */
export function createReviewFixture(
  overrides?: Partial<Prisma.ReviewCreateInput>,
): Prisma.ReviewCreateInput {
  return {
    id: overrides?.id ?? uuidv4(),
    providerId: overrides?.providerId ?? uuidv4(),
    customerId: overrides?.customerId ?? uuidv4(),
    rating: overrides?.rating ?? 4,
    review: overrides?.review ?? 'Great service!',
    response: overrides?.response ?? null,
    responseAt: overrides?.responseAt ?? null,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
    deletedAt: overrides?.deletedAt ?? null,
  }
}

/**
 * Creates multiple review fixtures with varying ratings
 */
export function createMultipleReviewFixtures(
  count: number,
  providerId: string,
  baseOverrides?: Partial<Prisma.ReviewCreateInput>,
): Prisma.ReviewCreateInput[] {
  return Array.from({ length: count }, (_, i) => {
    const rating = ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5

    return createReviewFixture({
      ...baseOverrides,
      id: uuidv4(),
      providerId,
      customerId: uuidv4(),
      rating,
      review: `Review ${i + 1} with rating ${rating}`,
    })
  })
}

/**
 * Creates a review with provider response
 */
export function createReviewWithResponseFixture(
  overrides?: Partial<Prisma.ReviewCreateInput>,
): Prisma.ReviewCreateInput {
  const now = new Date()

  return createReviewFixture({
    ...overrides,
    response: overrides?.response ?? 'Thank you for your feedback!',
    responseAt: overrides?.responseAt ?? now,
  })
}

/**
 * Creates test data for review statistics
 */
export function createReviewStatsTestData(
  providerId: string,
): Prisma.ReviewCreateInput[] {
  // Create reviews with specific rating distribution
  // 1 star: 2 reviews
  // 2 stars: 3 reviews
  // 3 stars: 5 reviews
  // 4 stars: 8 reviews
  // 5 stars: 12 reviews
  // Total: 30 reviews, Average: 3.9

  const reviews: Prisma.ReviewCreateInput[] = []
  const distribution = { 1: 2, 2: 3, 3: 5, 4: 8, 5: 12 }

  Object.entries(distribution).forEach(([rating, count]) => {
    for (let i = 0; i < count; i++) {
      reviews.push(
        createReviewFixture({
          providerId,
          rating: parseInt(rating),
          customerId: uuidv4(),
          review: `Test review with ${rating} stars`,
        }),
      )
    }
  })

  return reviews
}
