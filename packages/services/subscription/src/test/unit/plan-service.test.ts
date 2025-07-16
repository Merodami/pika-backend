import { MemoryCacheService } from '@pika/redis'
import type { CreateSubscriptionPlanDTO } from '@pika
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanService } from '../../services/PlanService.js'

// Mock repository
const mockPlanRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByStripePriceId: vi.fn(),
}

// Mock PaymentServiceClient
const mockPaymentClient = {
  createProduct: vi.fn(),
  createPrice: vi.fn(),
  listProducts: vi.fn(),
  listPrices: vi.fn(),
  updateProduct: vi.fn(),
  deactivatePrice: vi.fn(),
}

describe('PlanService', () => {
  let planService: PlanService
  let cacheService: MemoryCacheService

  beforeEach(() => {
    vi.clearAllMocks()
    cacheService = new MemoryCacheService()
    planService = new PlanService(
      mockPlanRepository as any,
      cacheService,
      mockPaymentClient as any,
    )
  })

  describe('createPlan', () => {
    it('should create a plan with Stripe integration', async () => {
      const planData: CreateSubscriptionPlanDTO = {
        name: 'Test Plan',
        description: 'Test Description',
        price: 2999, // £29.99 in pence
        currency: 'GBP',
        interval: 'MONTH',
        intervalCount: 1,
        creditsAmount: 25,
        features: ['Feature 1', 'Feature 2'],
      }

      const expectedPlan = {
        id: 'plan-123',
        ...planData,
        stripeProductId: 'prod_test_123',
        stripePriceId: 'price_test_123',
        isActive: true,
      }

      // Mock payment service calls
      mockPaymentClient.createProduct.mockResolvedValue({
        id: 'prod_test_123',
        name: 'Test Plan',
        active: true,
      })

      mockPaymentClient.createPrice.mockResolvedValue({
        id: 'price_test_123',
        productId: 'prod_test_123',
        amount: 2999,
        currency: 'GBP',
      })

      mockPlanRepository.create.mockResolvedValue(expectedPlan)

      const result = await planService.createPlan(planData)

      expect(result).toEqual(expectedPlan)
      expect(mockPaymentClient.createProduct).toHaveBeenCalledWith({
        name: 'Test Plan',
        description: 'Test Description',
        metadata: expect.any(Object),
      })
      expect(mockPaymentClient.createPrice).toHaveBeenCalledWith({
        productId: 'prod_test_123',
        amount: 2999,
        currency: 'GBP',
        interval: 'MONTH',
        intervalCount: 1,
      })
    })

    it('should handle Stripe errors gracefully', async () => {
      const planData: CreateSubscriptionPlanDTO = {
        name: 'Test Plan',
        price: 2999,
        currency: 'GBP',
        interval: 'MONTH',
        intervalCount: 1,
        creditsAmount: 25,
        features: [],
      }

      // Mock Stripe error
      mockPaymentClient.createProduct.mockRejectedValue(
        new Error('Stripe API Error'),
      )

      await expect(planService.createPlan(planData)).rejects.toThrow(
        'Stripe API Error',
      )
    })
  })

  describe('syncWithStripe', () => {
    it('should sync plans from Stripe', async () => {
      // Mock the list methods
      mockPaymentClient.listProducts.mockResolvedValue({
        data: [{ id: 'prod_test_123', name: 'Test Product', active: true }],
      })

      mockPaymentClient.listPrices.mockResolvedValue({
        data: [
          {
            id: 'price_test_123',
            productId: 'prod_test_123',
            amount: 2999,
            currency: 'GBP',
          },
        ],
      })

      mockPlanRepository.findByStripePriceId.mockResolvedValue(null)
      mockPlanRepository.create.mockResolvedValue({})

      await planService.syncWithStripe()

      // Verify that Stripe products and prices were fetched
      expect(mockPaymentClient.listProducts).toHaveBeenCalledWith(100)
      expect(mockPaymentClient.listPrices).toHaveBeenCalledWith(
        'prod_test_123',
        100,
      )
    })
  })
})
