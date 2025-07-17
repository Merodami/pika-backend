import { type AdminCreateDTO } from '@admin-write/domain/dtos/AdminDTO.js'
import { type Admin, type AdminDocument } from '@admin-write/domain/entities/Admin.js'

export interface AdminWriteRepositoryPort {
  createAdmin(dto: AdminCreateDTO): Promise<Admin>
  updateAdmin(id: string, dto: Partial<AdminDocument>): Promise<Admin>
  deleteAdmin(id: string): Promise<void>
}
