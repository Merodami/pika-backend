import { type CategoryCreateDTO } from '@category-write/domain/dtos/CategoryDTO.js'
import { type Category } from '@category-write/domain/entities/Category.js'
import { CategoryDocument } from '@pika/sdk'

export interface CategoryWriteRepositoryPort {
  createCategory(dto: CategoryCreateDTO): Promise<Category>
  updateCategory(id: string, dto: Partial<CategoryDocument>): Promise<Category>
  deleteCategory(id: string): Promise<void>
}
