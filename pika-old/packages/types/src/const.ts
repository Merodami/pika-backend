export const CategoryFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
} as const

export const CategorySortFieldEnum = {
  ...CategoryFieldEnum,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
} as const

/// Days of week for availability schedules
export const DaysOfWeek = {
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
  SAT: 'SAT',
  SUN: 'SUN',
} as const

/// Types of resources (tables, rooms, etc.)
export const ResourceType = {
  TABLE: 'TABLE',
  ROOM: 'ROOM',
} as const

export const CategoryItemStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SOLD_OUT: 'SOLD_OUT',
  ARCHIVED: 'ARCHIVED',
} as const

export const PaginationOrder = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const

export const UserProfileType = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  USER: 'USER',
  GUEST: 'GUEST',
} as const

export const RequestSource = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  USER: 'USER',
  GUEST: 'GUEST',
  WEBHOOK: 'WEBHOOK',
} as const
