import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type { SupportCommentDomain } from '@pika
import { SupportCommentMapper } from '@pika
import { ErrorFactory, toPrismaInclude } from '@pikad'
import type { ParsedIncludes } from '@pika'

export interface CreateSupportCommentInput {
  problemId: string
  userId: string
  content: string
  isInternal?: boolean
}

export interface UpdateSupportCommentInput {
  content?: string
  isInternal?: boolean
}

export interface ISupportCommentRepository {
  findAll(parsedIncludes?: ParsedIncludes): Promise<SupportCommentDomain[]>
  findByProblemId(
    problemId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain[]>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain | null>
  create(data: CreateSupportCommentInput): Promise<SupportCommentDomain>
  update(
    id: string,
    data: UpdateSupportCommentInput,
  ): Promise<SupportCommentDomain>
  delete(id: string): Promise<void>
}

export class SupportCommentRepository implements ISupportCommentRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Build include based on parsedIncludes parameter
   */
  private buildInclude(parsedIncludes?: ParsedIncludes) {
    return parsedIncludes && Object.keys(parsedIncludes).length > 0
      ? toPrismaInclude(parsedIncludes)
      : undefined
  }

  async findAll(
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain[]> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const comments = await this.prisma.supportComment.findMany({
        include,
        orderBy: {
          createdAt: 'desc',
        },
      })

      return comments.map(SupportCommentMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findAll', 'SupportComment', error)
    }
  }

  async findByProblemId(
    problemId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain[]> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const comments = await this.prisma.supportComment.findMany({
        where: { problemId },
        include,
        orderBy: {
          createdAt: 'asc',
        },
      })

      return comments.map(SupportCommentMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByProblemId',
        'SupportComment',
        error,
      )
    }
  }

  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain | null> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const comment = await this.prisma.supportComment.findUnique({
        where: { id },
        include,
      })

      return comment ? SupportCommentMapper.fromDocument(comment) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'SupportComment', error)
    }
  }

  async create(data: CreateSupportCommentInput): Promise<SupportCommentDomain> {
    try {
      const comment = await this.prisma.supportComment.create({
        data: {
          problemId: data.problemId,
          userId: data.userId,
          content: data.content,
          isInternal: data.isInternal || false,
        },
        include: {
          user: true,
        },
      })

      return SupportCommentMapper.fromDocument(comment)
    } catch (error) {
      throw ErrorFactory.databaseError('create', 'SupportComment', error)
    }
  }

  async update(
    id: string,
    data: UpdateSupportCommentInput,
  ): Promise<SupportCommentDomain> {
    try {
      const comment = await this.prisma.supportComment.update({
        where: { id },
        data: {
          content: data.content,
          isInternal: data.isInternal,
        },
        include: {
          user: true,
        },
      })

      return SupportCommentMapper.fromDocument(comment)
    } catch (error) {
      throw ErrorFactory.databaseError('update', 'SupportComment', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.supportComment.delete({
        where: { id },
      })
    } catch (error) {
      throw ErrorFactory.databaseError('delete', 'SupportComment', error)
    }
  }
}
