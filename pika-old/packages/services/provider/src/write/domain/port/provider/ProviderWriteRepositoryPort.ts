import { ProviderDocument } from '@pika/sdk'
import { type ProviderCreateDTO } from '@provider-write/domain/dtos/ProviderDTO.js'
import { type Provider } from '@provider-write/domain/entities/Provider.js'

export interface ProviderWriteRepositoryPort {
  createProvider(dto: ProviderCreateDTO, userId: string): Promise<Provider>
  updateProvider(id: string, dto: Partial<ProviderDocument>): Promise<Provider>
  deleteProvider(id: string): Promise<void>
  getProviderByUserId(userId: string): Promise<string | null>
}
