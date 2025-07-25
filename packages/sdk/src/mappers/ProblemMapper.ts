import type {
  ProblemPriorityType,
  ProblemStatusType,
  ProblemTypeType,
} from '@pika/types'
import { ProblemPriority, ProblemStatus, ProblemType } from '@pika/types'

import type { ProblemDomain } from '../domain/problem.js'
import type {
  CreateProblemDTO,
  ProblemDTO,
  UpdateProblemDTO,
} from '../dto/problem.dto.js'
import {
  type SupportCommentDocument,
  SupportCommentMapper,
} from './SupportCommentMapper.js'
import { type UserDocument, UserMapper } from './UserMapper.js'

/**
 * Interface representing a database Problem document
 * Uses camelCase for fields as they come from Prisma
 */
export interface ProblemDocument {
  id: string
  userId: string
  title: string
  description: string
  status: string
  priority: string
  type: string
  createdAt: Date
  updatedAt: Date | null
  resolvedAt: Date | null
  ticketNumber: string | null
  assignedTo: string | null
  files: string[]
  // Relations
  user?: UserDocument | null
  assignedUser?: UserDocument | null
  comments?: SupportCommentDocument[]
}

export class ProblemMapper {
  static fromDocument(doc: ProblemDocument): ProblemDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      status: doc.status as ProblemStatusType,
      priority: doc.priority as ProblemPriorityType,
      type: doc.type as ProblemTypeType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      resolvedAt: doc.resolvedAt,
      ticketNumber: doc.ticketNumber,
      assignedTo: doc.assignedTo,
      files: doc.files || [],
      user: doc.user ? UserMapper.fromDocument(doc.user) : null,
      assignedUser: doc.assignedUser
        ? UserMapper.fromDocument(doc.assignedUser)
        : null,
      comments: doc.comments
        ? doc.comments.map((comment) =>
            SupportCommentMapper.fromDocument(comment),
          )
        : undefined,
    }
  }

  static toDTO(domain: ProblemDomain): ProblemDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      title: domain.title,
      description: domain.description,
      status: domain.status,
      priority: domain.priority,
      type: domain.type,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
      resolvedAt: domain.resolvedAt ? domain.resolvedAt.toISOString() : null,
      ticketNumber: domain.ticketNumber,
      assignedTo: domain.assignedTo,
      files: domain.files,
      user: domain.user ? UserMapper.toDTO(domain.user) : null,
      assignedUser: domain.assignedUser
        ? UserMapper.toDTO(domain.assignedUser)
        : null,
      comments: domain.comments
        ? domain.comments.map((comment) => SupportCommentMapper.toDTO(comment))
        : undefined,
    }
  }

  /**
   * Convert domain entity to admin DTO format
   * Matches AdminTicketDetailResponse schema
   */
  static toAdminDTO(domain: ProblemDomain) {
    return {
      id: domain.id,
      ticketNumber: domain.ticketNumber || undefined,
      userId: domain.userId,
      userName: domain.user
        ? `${domain.user.firstName} ${domain.user.lastName}`
        : '',
      userEmail: domain.user?.email || '',
      title: domain.title,
      description: domain.description,
      type: domain.type,
      status: domain.status,
      priority: domain.priority,
      resolvedAt: domain.resolvedAt
        ? domain.resolvedAt.toISOString()
        : undefined,
      assignedTo: domain.assignedTo || undefined,
      assignedToName: domain.assignedUser
        ? `${domain.assignedUser.firstName} ${domain.assignedUser.lastName}`
        : undefined,
      files: domain.files || [],
      createdAt: domain.createdAt.toISOString(),
      updatedAt: (domain.updatedAt || new Date()).toISOString(),
    }
  }

  static fromCreateDTO(dto: CreateProblemDTO): Partial<ProblemDomain> {
    return {
      userId: dto.userId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || ProblemPriority.MEDIUM,
      status: ProblemStatus.OPEN,
      type: ProblemType.GENERAL,
      files: [],
    }
  }

  static fromUpdateDTO(dto: UpdateProblemDTO): Partial<ProblemDomain> {
    const domain: Partial<ProblemDomain> = {}

    if (dto.title !== undefined) domain.title = dto.title
    if (dto.description !== undefined) domain.description = dto.description
    if (dto.status !== undefined) domain.status = dto.status
    if (dto.priority !== undefined) domain.priority = dto.priority
    if (dto.type !== undefined) domain.type = dto.type
    if (dto.assignedTo !== undefined) domain.assignedTo = dto.assignedTo
    if (dto.files !== undefined) domain.files = dto.files
    if (dto.resolvedAt !== undefined) {
      domain.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : null
    }

    return domain
  }
}
