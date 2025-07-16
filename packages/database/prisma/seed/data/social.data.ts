/**
 * Social seed data and utilities
 */

import { faker } from '@faker-js/faker'
import {
  ActivityType,
  FriendOrClientType,
  FriendStatus,
  InteractionType,
  PrivacyLevel} from '@prisma/client'

export function generateActivityData(userId: string, relatedData: any) {
  const activityType = faker.helpers.arrayElement(Object.values(ActivityType))

  const baseActivity = {
    userId,
    type: activityType,
    entityType: getEntityTypeForActivity(activityType),
    entityId: faker.string.uuid(),
    privacy: faker.helpers.weightedArrayElement([
      { weight: 40, value: PrivacyLevel.PUBLIC },
      { weight: 30, value: PrivacyLevel.FRIENDS },
      { weight: 20, value: PrivacyLevel.FOLLOWERS },
      { weight: 10, value: PrivacyLevel.PRIVATE },
    ]),

    // Metadata based on activity type
    metadata: generateActivityMetadata(activityType, relatedData),
  }

  return baseActivity
}

function getEntityTypeForActivity(type: ActivityType): string {
  switch (type) {
    case ActivityType.SESSION_BOOKED:
    case ActivityType.SESSION_COMPLETED:
    case ActivityType.SESSION_REVIEWED:
      return 'session'

    case ActivityType.FRIEND_ADDED:
    case ActivityType.USER_FOLLOWED:
      return 'user'

    case ActivityType.GYM_VISITED:
      return 'gym'

    case ActivityType.ACHIEVEMENT_EARNED:
      return 'achievement'

    case ActivityType.PROFILE_UPDATED:
      return 'profile'

    case ActivityType.ENTITY_LIKED:
    case ActivityType.ENTITY_SHARED:
    case ActivityType.ENTITY_COMMENTED:
    case ActivityType.ENTITY_BOOKMARKED:
      return faker.helpers.arrayElement(['session', 'gym', 'activity'])

    default:
      return 'misc'
  }
}

function generateActivityMetadata(type: ActivityType, relatedData: any) {
  switch (type) {
    case ActivityType.SESSION_BOOKED:
      return {
        sessionTitle: relatedData.sessionTitle,
        sessionDate: relatedData.sessionDate,
        professionalName: relatedData.professionalName,
        gymName: relatedData.gymName,
      }

    case ActivityType.SESSION_COMPLETED:
      return {
        sessionTitle: relatedData.sessionTitle,
        duration: relatedData.duration,
        caloriesBurned: faker.number.int({ min: 200, max: 800 }),
        gymName: relatedData.gymName,
      }

    case ActivityType.SESSION_REVIEWED:
      return {
        sessionTitle: relatedData.sessionTitle,
        rating: faker.number.int({ min: 3, max: 5 }),
        reviewSnippet: faker.lorem.sentence(),
      }

    case ActivityType.ACHIEVEMENT_EARNED:
      return {
        achievementName: faker.helpers.arrayElement([
          'First Session Complete',
          '10 Sessions Milestone',
          'Perfect Week',
          'Early Bird',
          'Consistency King',
          'Social Butterfly',
          'Review Master',
        ]),
        achievementDescription: faker.lorem.sentence(),
        badgeUrl: faker.image.url(),
      }

    case ActivityType.PROFILE_UPDATED:
      return {
        updatedFields: faker.helpers.arrayElements([
          'bio', 'avatar', 'specialties', 'certifications', 'location'
        ], { min: 1, max: 3 }),
      }

    case ActivityType.GYM_VISITED:
      return {
        gymName: relatedData.gymName,
        checkInTime: faker.date.recent(),
      }

    default:
      return {}
  }
}

export function generateInteractionData(
  userId: string,
  entityType: string,
  entityId: string
) {
  const interactionType = faker.helpers.arrayElement(Object.values(InteractionType))

  return {
    userId,
    entityType,
    entityId,
    type: interactionType,
    content: interactionType === InteractionType.COMMENT
      ? generateCommentContent()
      : null,
    metadata: {
      timestamp: new Date().toISOString(),
      source: faker.helpers.arrayElement(['mobile', 'web']),
    },
  }
}

export function generateCommentContent(): string {
  return faker.helpers.arrayElement([
    'Great job! Keep it up! 💪',
    'Inspiring workout! 🔥',
    'This looks amazing!',
    'Love the energy!',
    faker.lorem.sentence(),
    'Awesome session! When\'s the next one?',
    'I need to try this!',
    'You\'re crushing it!',
    'This is exactly what I needed to see today!',
    'Can\'t wait to join next time!',
  ])
}

export function generateFollowData(followerId: string, followingId: string) {
  return {
    followerId,
    followingId,
  }
}

export function generateFriendData(userId: string, email: string) {
  const status = faker.helpers.weightedArrayElement([
    { weight: 60, value: FriendStatus.ACCEPTED },
    { weight: 25, value: FriendStatus.PENDING },
    { weight: 10, value: FriendStatus.DECLINED },
    { weight: 5, value: FriendStatus.BLOCKED },
  ])

  return {
    userId,
    email,
    name: faker.person.fullName(),
    avatarUrl: faker.datatype.boolean(0.7) ? faker.image.avatar() : null,
    type: faker.helpers.arrayElement([FriendOrClientType.FRIEND, FriendOrClientType.CLIENT]),
    status,

    // Optional message for friend requests
    message: status === FriendStatus.PENDING && faker.datatype.boolean(0.5)
      ? faker.lorem.sentence()
      : null,

    // If accepted, might have a referred user
    referredUserId: status === FriendStatus.ACCEPTED && faker.datatype.boolean(0.3)
      ? faker.string.uuid()
      : null,
  }
}

export function generateNotificationData(userId: string, relatedData: any) {
  const notificationType = faker.helpers.arrayElement([
    'session_reminder',
    'session_cancelled',
    'session_updated',
    'session_booked',
    'payment_success',
    'payment_failed',
    'friend_request',
    'new_follower',
    'review_received',
    'achievement_earned',
    'system_announcement',
    'promo_offer',
  ])

  return {
    userId,
    type: notificationType,

    // Content
    title: generateNotificationTitle(notificationType),
    description: generateNotificationDescription(notificationType, relatedData),

    // Status
    isRead: faker.datatype.boolean(0.6),
    readAt: faker.datatype.boolean(0.6) ? faker.date.recent({ days: 7 }) : null,

    // Metadata
    metadata: generateNotificationMetadata(notificationType, relatedData),
  }
}

function generateNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    'session_reminder': 'Upcoming Session Reminder',
    'session_cancelled': 'Session Cancelled',
    'session_updated': 'Session Details Updated',
    'session_booked': 'Session Booking Confirmed',
    'payment_success': 'Payment Successful',
    'payment_failed': 'Payment Failed',
    'friend_request': 'New Friend Request',
    'new_follower': 'New Follower',
    'review_received': 'New Review',
    'achievement_earned': 'Achievement Unlocked!',
    'system_announcement': 'Important Update',
    'promo_offer': 'Special Offer for You',
  }

  return titles[type as keyof typeof titles] || 'Notification'
}

function generateNotificationDescription(type: string, data: any): string {
  switch (type) {
    case 'session_reminder':
      return `Your session "${data.sessionTitle}" starts in 1 hour at ${data.gymName}`
    case 'session_booked':
      return `You're all set for "${data.sessionTitle}" on ${data.sessionDate}`
    case 'friend_request':
      return `${data.userName} wants to be your friend`
    case 'new_follower':
      return `${data.userName} started following you`
    case 'review_received':
      return `${data.userName} left a ${data.rating}-star review for your session`
    default:
      return faker.lorem.sentence()
  }
}

function generateNotificationMetadata(type: string, data: any): any {
  switch (type) {
    case 'session_reminder':
      return {
        sessionId: data.sessionId,
        sessionTitle: data.sessionTitle,
        startTime: data.startTime,
        gymId: data.gymId,
      }
    case 'payment_success':
      return {
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        transactionId: faker.string.alphanumeric(12).toUpperCase(),
      }
    case 'friend_request':
      return {
        friendId: data.friendId,
        friendName: data.userName,
      }
    default:
      return {}
  }
}