import {
  type VoucherBookCreateDTO,
  type VoucherBookStatusUpdateDTO,
  type VoucherBookUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { type VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'

export interface PDFWriteRepositoryPort {
  createVoucherBook(dto: VoucherBookCreateDTO): Promise<VoucherBook>
  updateVoucherBook(id: string, dto: VoucherBookUpdateDTO): Promise<VoucherBook>
  updateVoucherBookStatus(
    id: string,
    dto: VoucherBookStatusUpdateDTO,
  ): Promise<VoucherBook>
  deleteVoucherBook(id: string): Promise<void>
  findVoucherBookById(id: string): Promise<VoucherBook | null>
  getVoucherBookWithPages(id: string): Promise<any | null>
}
