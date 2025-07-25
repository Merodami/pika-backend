import type {
  ProblemPriorityType,
  ProblemStatusType,
  ProblemTypeType,
} from '@pika/types'

import type { SupportCommentDTO } from './supportComment.dto.js'
import type { UserDTO } from './user.dto.js'

export interface ProblemDTO {
  id: string
  userId: string
  title: string
  description: string
  status: ProblemStatusType
  priority: ProblemPriorityType
  type: ProblemTypeType
  createdAt: string
  updatedAt?: string | null
  resolvedAt?: string | null
  ticketNumber?: string | null
  assignedTo?: string | null
  files: string[]

  // Relations
  user?: UserDTO | null
  assignedUser?: UserDTO | null
  comments?: SupportCommentDTO[]
}

export interface CreateProblemDTO {
  userId: string
  title: string
  description: string
  priority?: ProblemPriorityType
  type?: ProblemTypeType
  files?: string[]
}

export interface UpdateProblemDTO {
  title?: string
  description?: string
  status?: ProblemStatusType
  priority?: ProblemPriorityType
  type?: ProblemTypeType
  resolvedAt?: string | null
  assignedTo?: string | null
  files?: string[]
}
