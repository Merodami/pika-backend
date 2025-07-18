import {
  type VoucherCreateDTO,
  type VoucherStateUpdateDTO,
  type VoucherUpdateDTO,
} from '@voucher-write/domain/dtos/VoucherDTO.js'
import { type Voucher } from '@voucher-write/domain/entities/Voucher.js'

export interface VoucherWriteRepositoryPort {
  createVoucher(dto: VoucherCreateDTO): Promise<Voucher>
  updateVoucher(id: string, dto: VoucherUpdateDTO): Promise<Voucher>
  deleteVoucher(id: string): Promise<void>
  publishVoucher(id: string): Promise<Voucher>
  expireVoucher(id: string): Promise<Voucher>
  incrementRedemptions(id: string): Promise<Voucher>
  findById(id: string): Promise<Voucher | null>
  findVoucherById(id: string): Promise<Voucher | null>
  updateVoucherState(id: string, dto: VoucherStateUpdateDTO): Promise<Voucher>

  // Scan tracking
  trackScan(scan: {
    voucherId: string
    userId?: string
    scanType: 'CUSTOMER' | 'BUSINESS'
    scanSource: string
    location?: any
    deviceInfo: any
    scannedAt: Date
  }): Promise<string>
  incrementScanCount(voucherId: string): Promise<void>

  // Customer voucher claims
  createCustomerVoucher(claim: {
    id: string
    customerId: string
    voucherId: string
    claimedAt: Date
    status: string
    notificationPreferences?: any
  }): Promise<void>
  getCustomerVoucher(customerId: string, voucherId: string): Promise<any | null>
  getCustomerVoucherCount(customerId: string): Promise<number>
  getClaimCount(voucherId: string): Promise<number>
  incrementClaimCount(voucherId: string): Promise<void>
}
