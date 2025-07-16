/**
 * Session seed data and utilities
 */

import { faker } from '@faker-js/faker'
import { InviteeStatus, SessionPurpose, SessionRating,SessionStatus, TeamSize } from '@prisma/client'

export const SESSION_TITLES = [
  'High-Intensity Interval Training',
  'Yoga Flow for Beginners',
  'Strength Training Fundamentals',
  'CrossFit WOD',
  'Pilates Core Workout',
  'Boxing Fitness',
  'Spin Class',
  'Functional Movement',
  'Olympic Lifting Workshop',
  'Mobility and Flexibility',
  'Boot Camp',
  'Circuit Training',
  'TRX Suspension Training',
  'Kettlebell Workout',
  'Barre Fitness',
]

export function generateSessionData(
  userId: string,
  gymId: string,
  trainerId?: string,
  gymName?: string,
  trainerName?: string
) {
  const sessionDate = faker.date.future({ years: 0.5 })
  const startHour = faker.number.int({ min: 6, max: 20 })
  const duration = faker.helpers.arrayElement([30, 45, 60, 90])

  // Create proper Time objects for Prisma
  const startTime = new Date()

  startTime.setHours(startHour, 0, 0, 0)
  startTime.setFullYear(1970, 0, 1) // Time fields use 1970-01-01 as date

  const endTime = new Date()

  endTime.setHours(startHour + Math.floor(duration / 60), duration % 60, 0, 0)
  endTime.setFullYear(1970, 0, 1)

  const status = faker.helpers.weightedArrayElement([
    { weight: 50, value: SessionStatus.UPCOMING },
    { weight: 20, value: SessionStatus.COMPLETED },
    { weight: 10, value: SessionStatus.CANCELLED },
    { weight: 10, value: SessionStatus.PAYMENT_PENDING },
    { weight: 5, value: SessionStatus.PENDING_APPROVAL },
    { weight: 5, value: SessionStatus.DECLINED },
  ])

  const purpose = faker.helpers.weightedArrayElement([
    { weight: 70, value: SessionPurpose.WORKOUT },
    { weight: 20, value: SessionPurpose.WORKING },
    { weight: 10, value: SessionPurpose.CONTENT },
  ])

  return {
    userId,
    gymId,
    trainerId: trainerId || null,
    gymName: gymName || null,
    trainerName: trainerName || null,

    // Schedule
    date: sessionDate,
    startTime,
    endTime,
    duration,

    // Details
    purpose,
    teamSize: purpose === SessionPurpose.CONTENT
      ? faker.helpers.arrayElement([TeamSize.CREATOR, TeamSize.BRAND])
      : null,

    // Pricing (in credits)
    price: faker.number.int({ min: 1, max: 5 }),

    // Status
    status,
    paymentDeadline: status === SessionStatus.PAYMENT_PENDING
      ? faker.date.future({ years: 0.1 })
      : null,

    // Guests
    guests: faker.datatype.boolean(0.2)
      ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.internet.email())
      : [],

    // Feedback
    feedback: status === SessionStatus.COMPLETED && faker.datatype.boolean(0.5)
      ? faker.lorem.paragraph()
      : null,

    // Cancellation
    cancelledAt: status === SessionStatus.CANCELLED
      ? faker.date.recent({ days: 7 })
      : null,
  }
}

export function generateSessionInvitee(sessionId: string, friendId: string, status: SessionStatus) {
  const inviteeStatus = status === SessionStatus.COMPLETED
    ? faker.helpers.weightedArrayElement([
        { weight: 70, value: InviteeStatus.CONFIRMED },
        { weight: 20, value: InviteeStatus.DECLINED },
        { weight: 10, value: InviteeStatus.PENDING },
      ])
    : faker.helpers.weightedArrayElement([
        { weight: 50, value: InviteeStatus.PENDING },
        { weight: 40, value: InviteeStatus.CONFIRMED },
        { weight: 10, value: InviteeStatus.DECLINED },
      ])

  return {
    sessionId,
    friendId,
    status: inviteeStatus,
    invitedAt: faker.date.recent({ days: 30 }),
  }
}

export function generateSessionReview(sessionId: string, userId: string) {
  const rating = faker.helpers.weightedArrayElement([
    { weight: 20, value: SessionRating.SAD },
    { weight: 30, value: SessionRating.NEUTRAL },
    { weight: 50, value: SessionRating.HAPPY },
  ])

  return {
    sessionId,
    userId,
    rating,
    reason: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : null,
    image: faker.datatype.boolean(0.2) ? faker.image.url() : null,
  }
}

export function generateSessionRecord(sessionId: string, modifiedBy: string) {
  const type = faker.helpers.arrayElement([
    'created',
    'updated',
    'cancelled',
    'completed',
    'payment_received',
    'attendee_added',
    'attendee_removed',
    'time_changed',
    'trainer_assigned',
  ])

  const descriptions: Record<string, string[]> = {
    created: ['Session created'],
    updated: ['Session details updated', 'Session time changed', 'Session location updated'],
    cancelled: ['Session cancelled by trainer', 'Session cancelled by user', 'Session cancelled due to weather'],
    completed: ['Session completed successfully'],
    payment_received: ['Payment received', 'Credits deducted'],
    attendee_added: ['New attendee joined', 'Guest added to session'],
    attendee_removed: ['Attendee cancelled', 'Guest removed from session'],
    time_changed: ['Start time updated', 'Duration changed'],
    trainer_assigned: ['Trainer assigned to session', 'Trainer changed'],
  }

  return {
    sessionId,
    type,
    description: faker.helpers.arrayElement(
      descriptions[type as keyof typeof descriptions] || ['Session record created']
    ),
    modifiedBy,
  }
}