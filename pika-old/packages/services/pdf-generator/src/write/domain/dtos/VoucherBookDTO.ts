// VoucherBook DTOs for write operations

import { VoucherBookStatus, VoucherBookType } from '@prisma/client'

export type VoucherBookCreateDTO = {
  title: string
  edition?: string
  bookType?: VoucherBookType
  month?: number
  year: number
  totalPages?: number
  coverImageUrl?: string
  createdBy: string
  providerId?: string
}

export type VoucherBookUpdateDTO = {
  title?: string
  edition?: string
  bookType?: VoucherBookType
  month?: number
  year?: number
  totalPages?: number
  coverImageUrl?: string
  backImageUrl?: string
}

export type VoucherBookStatusUpdateDTO = {
  status: VoucherBookStatus
  pdfUrl?: string
}
