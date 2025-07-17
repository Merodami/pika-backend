import {
  VoucherBookPageCreateDTO,
  VoucherBookPageUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { VoucherBookPage } from '@prisma/client'

export interface VoucherBookPageWriteRepositoryPort {
  createPage(
    bookId: string,
    dto: VoucherBookPageCreateDTO,
  ): Promise<VoucherBookPage>
  updatePage(
    pageId: string,
    dto: VoucherBookPageUpdateDTO,
  ): Promise<VoucherBookPage>
  deletePage(pageId: string): Promise<void>
  findById(pageId: string): Promise<VoucherBookPage | null>
  findByBookId(bookId: string): Promise<VoucherBookPage[]>
  findByBookIdAndPageNumber(
    bookId: string,
    pageNumber: number,
  ): Promise<VoucherBookPage | null>
}
