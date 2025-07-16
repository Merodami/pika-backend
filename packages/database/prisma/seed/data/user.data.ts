/**
 * User seed data and utilities
 */

import { faker } from '@faker-js/faker'
import { UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

export const PROFESSIONAL_SPECIALTIES = [
  'Personal Training',
  'Yoga Instruction',
  'Pilates',
  'CrossFit',
  'Strength & Conditioning',
  'Nutrition Coaching',
  'Sports Performance',
  'Rehabilitation',
  'Boxing',
  'Martial Arts',
  'Dance Fitness',
  'Swimming',
  'Running Coach',
  'Cycling Coach',
  'Group Fitness',
]

export const THERAPIST_SPECIALTIES = [
  'Sports Massage',
  'Physical Therapy',
  'Chiropractic',
  'Acupuncture',
  'Osteopathy',
  'Deep Tissue Massage',
  'Swedish Massage',
  'Reflexology',
  'Physiotherapy',
  'Injury Rehabilitation',
]

export async function generateUserData(role: UserRole, index: number) {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const isVerified = role === UserRole.ADMIN || faker.datatype.boolean(0.8)

  // Default passwords for testing
  let email: string
  let password: string

  switch (role) {
    case UserRole.ADMIN:
      email = index === 0 ? 'admin@pika.com' : `admin${index}@pika.com`
      password = 'Admin123!'
      break
    case UserRole.PROFESSIONAL:
      email = index === 0 ? 'trainer@pikaker.internet.email({ firstName, lastName })
      password = 'Trainer123!'
      break
    case UserRole.THERAPIST:
      email = index === 0 ? 'therapist@pikaker.internet.email({ firstName, lastName })
      password = 'Therapist123!'
      break
    case UserRole.CONTENT_CREATOR:
      email = index === 0 ? 'creator@pikaker.internet.email({ firstName, lastName })
      password = 'Creator123!'
      break
    default:
      email = index === 0 ? 'member@pikaker.internet.email({ firstName, lastName })
      password = 'Member123!'
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return {
    email,
    emailVerified: isVerified,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber: faker.phone.number(),
    phoneVerified: faker.datatype.boolean(0.6),
    avatarUrl: faker.image.avatar(),
    role,
    status: faker.helpers.weightedArrayElement([
      { weight: 85, value: UserStatus.ACTIVE },
      { weight: 10, value: UserStatus.UNCONFIRMED },
      { weight: 3, value: UserStatus.SUSPENDED },
      { weight: 2, value: UserStatus.BANNED },
    ]),
    lastLoginAt: faker.date.recent({ days: 7 }),

    // Gym platform specific fields
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    alias: faker.datatype.boolean(0.3) ? faker.internet.username() : null,
    appVersion: faker.datatype.boolean(0.8) ? faker.system.semver() : null,
    activeMembership: faker.datatype.boolean(0.6),
    guests: faker.datatype.boolean(0.2)
      ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.internet.email())
      : [],
    stripeUserId: faker.datatype.boolean(0.5) ? `stripe_${faker.string.alphanumeric(16)}` : null,
  }
}

export function generateProfessionalData(userId: string) {
  const specialties = faker.helpers.arrayElements(PROFESSIONAL_SPECIALTIES, { min: 1, max: 3 })

  return {
    userId,
    description: faker.lorem.paragraphs(2),
    specialties,
    favoriteGyms: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
      faker.string.uuid()
    ),
  }
}

export function generateParQData(userId: string) {
  return {
    userId,

    // Basic health questions
    medicalClearance: faker.datatype.boolean(0.95),
    existingInjuries: faker.datatype.boolean(0.15),
    symptomsCheck: faker.datatype.boolean(0.95),
    doctorConsultation: faker.datatype.boolean(0.1),
    experienceLevel: faker.datatype.boolean(0.7),
    properTechnique: faker.datatype.boolean(0.8),
    gymEtiquette: faker.datatype.boolean(0.9),
  }
}