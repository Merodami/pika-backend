import { UserRole, UserStatus } from '@pika/types-core'

import {
  CreateUserData,
  UserService,
  UserServiceUser,
} from '../strategies/LocalAuthStrategy.js'

/**
 * Adapter to bridge auth package with user service
 * Implements UserService interface for LocalAuthStrategy
 * This allows the auth package to interact with user data without tight coupling
 */
export class UserServiceAdapter implements UserService {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async findByEmail(email: string): Promise<UserServiceUser | null> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isActive: () => user.isActive(),
    }
  }

  async createUser(data: CreateUserData): Promise<UserServiceUser> {
    const user = await this.userRepository.create(data)

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isActive: () => user.isActive(),
    }
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    await this.userRepository.updateLastLogin(userId, loginTime)
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.userRepository.emailExists(email)
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    return await this.userRepository.phoneExists(phoneNumber)
  }
}

/**
 * Interface for user repository that the adapter requires
 * This defines the minimal contract needed from the user service
 */
export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<UserEntity | null>
  create(data: CreateUserData): Promise<UserEntity>
  updateLastLogin(userId: string, loginTime: Date): Promise<void>
  emailExists(email: string): Promise<boolean>
  phoneExists(phoneNumber: string): Promise<boolean>
}

/**
 * Minimal user entity interface for the adapter
 */
export interface UserEntity {
  id: string
  email: string
  password?: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
  isActive(): boolean
}
