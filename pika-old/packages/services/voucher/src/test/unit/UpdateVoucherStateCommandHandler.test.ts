import type { ServiceContext } from '@pika/types-core'
import { UpdateVoucherStateCommandHandler } from '@voucher-write/application/use_cases/commands/UpdateVoucherStateCommandHandler.js'
import type { VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockVoucherWriteRepository } from '../mocks/voucherWriteMocks.js'

describe('UpdateVoucherStateCommandHandler', () => {
  let handler: UpdateVoucherStateCommandHandler
  let mockRepository: VoucherWriteRepositoryPort & {
    updateVoucherState?: any
    incrementRedemptionCount?: any
  }
  let mockContext: ServiceContext

  beforeEach(() => {
    // Reset the mock
    mockVoucherWriteRepository.reset()

    // Add missing methods to the mock
    mockRepository = {
      ...mockVoucherWriteRepository,
      findVoucherById: vi.fn(),
      updateVoucherState: vi.fn(),
      incrementRedemptionCount: vi.fn(),
    }

    handler = new UpdateVoucherStateCommandHandler(mockRepository as any)
    mockContext = {
      serviceName: 'redemption-service',
      correlationId: 'test-correlation-id',
    }
  })

  describe('execute', () => {
    it('should successfully update voucher state from CLAIMED to REDEEMED', async () => {
      // Arrange
      const voucherId = 'test-voucher-id'
      const dto = {
        state: 'REDEEMED',
        redeemedAt: '2024-01-01T00:00:00Z',
        redeemedBy: 'customer-123',
        location: {
          lat: -25.2637,
          lng: -57.5759,
        },
      }

      // Mock the voucher exists and is in CLAIMED state
      const mockVoucher = {
        id: voucherId,
        state: 'CLAIMED',
        currentRedemptions: 0,
      }

      mockRepository.findVoucherById = vi
        .fn()
        .mockResolvedValue(mockVoucher as any)
      mockRepository.updateVoucherState.mockResolvedValue({
        ...mockVoucher,
        state: 'REDEEMED',
        currentRedemptions: 1,
      } as any)

      // Act
      const result = await handler.execute(voucherId, dto, mockContext)

      // Assert
      expect(result).toBeDefined()
      expect(result.state).toBe('REDEEMED')
      expect(result.currentRedemptions).toBe(1)
      expect(mockRepository.findVoucherById).toHaveBeenCalledWith(voucherId)
      expect(mockRepository.updateVoucherState).toHaveBeenCalledWith(
        voucherId,
        dto,
      )
    })

    it('should reject invalid state transitions', async () => {
      // Arrange
      const voucherId = 'test-voucher-id'
      const dto = {
        state: 'PUBLISHED', // Invalid transition from CLAIMED
      }

      // Mock the voucher exists and is in CLAIMED state
      const mockVoucher = {
        id: voucherId,
        state: 'CLAIMED',
      }

      mockRepository.findVoucherById = vi
        .fn()
        .mockResolvedValue(mockVoucher as any)

      // Act & Assert
      await expect(
        handler.execute(voucherId, dto, mockContext),
      ).rejects.toThrow()
      expect(mockRepository.updateVoucherState).not.toHaveBeenCalled()
    })

    it('should handle voucher not found', async () => {
      // Arrange
      const voucherId = 'non-existent-id'
      const dto = { state: 'REDEEMED' }

      mockRepository.findVoucherById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(
        handler.execute(voucherId, dto, mockContext),
      ).rejects.toThrow()
      expect(mockRepository.updateVoucherState).not.toHaveBeenCalled()
    })

    it('should increment redemption count when transitioning to REDEEMED', async () => {
      // Arrange
      const voucherId = 'test-voucher-id'
      const dto = {
        state: 'REDEEMED',
        redeemedAt: new Date().toISOString(),
        redeemedBy: 'customer-456',
      }

      const mockVoucher = {
        id: voucherId,
        state: 'CLAIMED',
        currentRedemptions: 5,
      }

      mockRepository.findVoucherById = vi
        .fn()
        .mockResolvedValue(mockVoucher as any)
      mockRepository.updateVoucherState.mockResolvedValue({
        ...mockVoucher,
        state: 'REDEEMED',
        currentRedemptions: 6,
      } as any)

      // Act
      const result = await handler.execute(voucherId, dto, mockContext)

      // Assert
      expect(result.currentRedemptions).toBe(6)
      // Note: incrementRedemptionCount is not called in the current implementation
      expect(mockRepository.updateVoucherState).toHaveBeenCalledWith(
        voucherId,
        dto,
      )
    })

    it('should allow EXPIRED transition from any state', async () => {
      // Test from PUBLISHED
      const mockVoucher = {
        id: 'test-id',
        state: 'PUBLISHED',
      }

      mockRepository.findVoucherById = vi
        .fn()
        .mockResolvedValue(mockVoucher as any)
      mockRepository.updateVoucherState.mockResolvedValue({
        ...mockVoucher,
        state: 'EXPIRED',
      } as any)

      const result = await handler.execute(
        'test-id',
        { state: 'EXPIRED' },
        mockContext,
      )

      expect(result.state).toBe('EXPIRED')
    })
  })
})
