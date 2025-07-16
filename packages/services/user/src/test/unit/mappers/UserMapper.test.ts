import { UserDocument, UserDomain, UserMapper } from '@pika/sdk'
import { describe, expect, it } from 'vitest'

describe('UserMapper', () => {
  const mockUserDocument: UserDocument = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    emailVerified: true,
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+595991234567',
    phoneVerified: false,
    avatarUrl: 'https://example.com/avatar.jpg',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  }

  describe('fromDocument', () => {
    it('should map UserDocument to UserDomain correctly', () => {
      const result = UserMapper.fromDocument(mockUserDocument)

      expect(result.id).toBe(mockUserDocument.id)
      expect(result.email).toBe(mockUserDocument.email)
      expect(result.firstName).toBe(mockUserDocument.firstName)
      expect(result.lastName).toBe(mockUserDocument.lastName)
      expect(result.role).toBe('ADMIN')
      expect(result.status).toBe('ACTIVE')
    })

    it('should handle date conversion correctly', () => {
      const result = UserMapper.fromDocument(mockUserDocument)

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.lastLoginAt).toBeInstanceOf(Date)
    })
  })

  describe('toDTO', () => {
    it('should map UserDomain to DTO correctly', () => {
      const userDomain: UserDomain = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+595991234567',
        phoneVerified: false,
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'ADMIN',
        status: 'ACTIVE',
        lastLoginAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      }

      const result = UserMapper.toDTO(userDomain)

      expect(result.id).toBe(userDomain.id)
      expect(result.email).toBe(userDomain.email)
      expect(result.firstName).toBe(userDomain.firstName)
      expect(result.lastName).toBe(userDomain.lastName)
      expect(result.phoneNumber).toBe(userDomain.phoneNumber)
      expect(result.emailVerified).toBe(userDomain.emailVerified)
      expect(result.phoneVerified).toBe(userDomain.phoneVerified)
      expect(result.avatarUrl).toBe(userDomain.avatarUrl)
      expect(result.role).toBe(userDomain.role)
      expect(result.status).toBe(userDomain.status)
    })

    it('should format dates as ISO strings', () => {
      const userDomain: UserDomain = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        phoneVerified: false,
        avatarUrl: null,
        role: 'ADMIN',
        status: 'ACTIVE',
        lastLoginAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      }

      const result = UserMapper.toDTO(userDomain)

      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.updatedAt).toBe('2024-01-01T12:00:00.000Z')
      expect(result.lastLoginAt).toBe('2024-01-01T10:00:00.000Z')
    })
  })

  describe('fromDTO', () => {
    it('should map DTO to UserDomain correctly', () => {
      const dto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+595991234567',
        phoneVerified: false,
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        lastLoginAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const result = UserMapper.fromDTO(dto)

      expect(result.id).toBe(dto.id)
      expect(result.email).toBe(dto.email)
      expect(result.firstName).toBe(dto.firstName)
      expect(result.lastName).toBe(dto.lastName)
      expect(result.phoneNumber).toBe(dto.phoneNumber)
      expect(result.emailVerified).toBe(dto.emailVerified)
      expect(result.phoneVerified).toBe(dto.phoneVerified)
      expect(result.avatarUrl).toBe(dto.avatarUrl)
      expect(result.role).toBe(dto.role)
      expect(result.status).toBe(dto.status)
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain data integrity through document -> domain -> DTO -> domain', () => {
      const originalDomain = UserMapper.fromDocument(mockUserDocument)
      const dto = UserMapper.toDTO(originalDomain)
      const finalDomain = UserMapper.fromDTO(dto)

      expect(finalDomain.id).toBe(originalDomain.id)
      expect(finalDomain.email).toBe(originalDomain.email)
      expect(finalDomain.firstName).toBe(originalDomain.firstName)
      expect(finalDomain.lastName).toBe(originalDomain.lastName)
      expect(finalDomain.role).toBe(originalDomain.role)
      expect(finalDomain.status).toBe(originalDomain.status)
    })
  })
})
