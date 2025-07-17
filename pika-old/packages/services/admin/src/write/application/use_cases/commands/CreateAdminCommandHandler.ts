import { type AdminCreateDTO } from '@admin-write/domain/dtos/AdminDTO.js'
import { Admin } from '@admin-write/domain/entities/Admin.js'
import { type AdminWriteRepositoryPort } from '@admin-write/domain/port/admin/AdminWriteRepositoryPort.js'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import { AdminMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Command handler for creating new admins
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateAdminCommandHandler {
  constructor(private readonly repository: AdminWriteRepositoryPort) {}

  /**
   * Executes the create admin command
   * Validates input, applies business rules, and persists the new admin
   */
  async execute(dto: AdminCreateDTO): Promise<Admin> {
    try {
      return await this.repository.createAdmin(dto)
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to create admin', {
        source: 'CreateAdminCommandHandler.execute',
        suggestion: 'Check admin data and try again',
        metadata: {
          adminName: AdminMapper.getLocalizedValue(
            dto.name as MultilingualContent,
            DEFAULT_LANGUAGE,
          ),
          adminEmail: dto.email,
          adminRole: dto.role,
        },
      })
    }
  }
}
