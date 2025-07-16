import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type {
  CreateCreditsPackDTO,
  CreditsPackDomain,
  UpdateCreditsPackDTO,
} from '@pika
import { CreditsPackMapper } from '@pika
import { ErrorFactory } from '@pika

export interface ICreditPackRepository {
  findAll(): Promise<CreditsPackDomain[]>
  findAllActive(): Promise<CreditsPackDomain[]>
  findById(id: string): Promise<CreditsPackDomain | null>
  create(data: CreateCreditsPackDTO): Promise<CreditsPackDomain>
  update(id: string, data: UpdateCreditsPackDTO): Promise<CreditsPackDomain>
  delete(id: string): Promise<void>
  deactivate(id: string): Promise<CreditsPackDomain>
  activate(id: string): Promise<CreditsPackDomain>
}

export class CreditPackRepository implements ICreditPackRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(): Promise<CreditsPackDomain[]> {
    try {
      const cacheKey = 'credit-packs:all'

      if (this.cache) {
        const cached = await this.cache.get<CreditsPackDomain[]>(cacheKey)

        if (cached) return cached
      }

      const packs = await this.prisma.creditsPack.findMany({
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      })

      const domains = packs.map(CreditsPackMapper.fromDocument)

      if (this.cache) {
        await this.cache.set(cacheKey, domains, 600) // 10 minutes cache
      }

      return domains
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findAll',
        'Failed to find all credit packs',
        error,
      )
    }
  }

  async findAllActive(): Promise<CreditsPackDomain[]> {
    try {
      const cacheKey = 'credit-packs:active'

      if (this.cache) {
        const cached = await this.cache.get<CreditsPackDomain[]>(cacheKey)

        if (cached) return cached
      }

      const packs = await this.prisma.creditsPack.findMany({
        where: { active: true },
        orderBy: { amount: 'asc' },
      })

      const domains = packs.map(CreditsPackMapper.fromDocument)

      if (this.cache) {
        await this.cache.set(cacheKey, domains, 600) // 10 minutes cache
      }

      return domains
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findAllActive',
        'Failed to find active credit packs',
        error,
      )
    }
  }

  async findById(id: string): Promise<CreditsPackDomain | null> {
    try {
      const cacheKey = `credit-pack:${id}`

      if (this.cache) {
        const cached = await this.cache.get<CreditsPackDomain>(cacheKey)

        if (cached) return cached
      }

      const pack = await this.prisma.creditsPack.findUnique({
        where: { id },
      })

      if (!pack) return null

      const domain = CreditsPackMapper.fromDocument(pack)

      if (this.cache) {
        await this.cache.set(cacheKey, domain, 300) // 5 minutes cache
      }

      return domain
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find credit pack by ID',
        error,
      )
    }
  }

  async create(data: CreateCreditsPackDTO): Promise<CreditsPackDomain> {
    try {
      const pack = await this.prisma.creditsPack.create({
        data: {
          type: data.type,
          amount: data.amount,
          frequency: data.frequency,
          price: data.price,
          active: data.active ?? true,
          createdBy: data.createdBy,
        },
      })

      await this.clearCaches()

      return CreditsPackMapper.fromDocument(pack)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create credit pack',
        error,
      )
    }
  }

  async update(
    id: string,
    data: UpdateCreditsPackDTO,
  ): Promise<CreditsPackDomain> {
    try {
      const pack = await this.prisma.creditsPack.update({
        where: { id },
        data: {
          type: data.type,
          amount: data.amount,
          frequency: data.frequency,
          price: data.price,
          active: data.active,
        },
      })

      await this.clearCaches(id)

      return CreditsPackMapper.fromDocument(pack)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update credit pack',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.creditsPack.delete({
        where: { id },
      })

      await this.clearCaches(id)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete credit pack',
        error,
      )
    }
  }

  async deactivate(id: string): Promise<CreditsPackDomain> {
    try {
      const pack = await this.prisma.creditsPack.update({
        where: { id },
        data: { active: false },
      })

      await this.clearCaches(id)

      return CreditsPackMapper.fromDocument(pack)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'deactivate',
        'Failed to deactivate credit pack',
        error,
      )
    }
  }

  async activate(id: string): Promise<CreditsPackDomain> {
    try {
      const pack = await this.prisma.creditsPack.update({
        where: { id },
        data: { active: true },
      })

      await this.clearCaches(id)

      return CreditsPackMapper.fromDocument(pack)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'activate',
        'Failed to activate credit pack',
        error,
      )
    }
  }

  private async clearCaches(id?: string): Promise<void> {
    if (!this.cache) return

    const keysToDelete = ['credit-packs:all', 'credit-packs:active']

    if (id) {
      keysToDelete.push(`credit-pack:${id}`)
    }

    await Promise.all(keysToDelete.map((key) => this.cache!.del(key)))
  }
}
