/**
 * Support seed data and utilities
 */

import { faker } from '@faker-js/faker'
import { ProblemPriority, ProblemStatus, ProblemType } from '@prisma/client'

export const PROBLEM_SUBJECTS = {
  [ProblemType.TECHNICAL]: [
    'App crashes when booking sessions',
    'Cannot login to my account',
    'Payment processing error',
    'Session history not loading',
    'Push notifications not working',
    'Profile picture upload fails',
    'QR code scanner not functioning',
    'Video call quality issues',
    'Calendar sync problems',
    'App freezes on startup',
  ],
  [ProblemType.BILLING]: [
    'Duplicate charge on my card',
    'Subscription not renewed',
    'Wrong amount charged',
    'Refund request for cancelled session',
    'Credits not added after purchase',
    'Promo code not applying',
    'Invoice not received',
    'Payment method update failed',
    'Subscription cancellation issue',
    'Unexpected charges',
  ],
  [ProblemType.ACCOUNT]: [
    'Cannot reset password',
    'Email verification not received',
    'Account locked after multiple attempts',
    'Need to change email address',
    'Two-factor authentication issues',
    'Account deletion request',
    'Merge duplicate accounts',
    'Privacy settings not saving',
    'Profile information not updating',
    'Account hacked',
  ],
  [ProblemType.BOOKING]: [
    'Cannot book session',
    'Session booking error',
    'Double booking issue',
    'Booking confirmation not received',
    'Unable to cancel booking',
    'Booking shows wrong time',
    'Credit not deducted correctly',
    'Booking limit reached incorrectly',
    'Guest booking not working',
    'Recurring booking setup failed',
  ],
  [ProblemType.GYM_ISSUE]: [
    'Gym location incorrect on map',
    'Gym hours not updated',
    'Equipment list outdated',
    'Gym temporarily closed',
    'Access code not working',
    'Parking information wrong',
    'Gym facilities not as described',
    'Safety concern at gym',
    'Cleanliness issues',
    'Overcrowding problems',
  ],
  [ProblemType.TRAINER_ISSUE]: [
    'Trainer was late to session',
    'Trainer cancelled last minute',
    'Trainer was unprofessional',
    'Communication issues with trainer',
    'Training quality concerns',
    'Trainer availability incorrect',
    'Certification questions',
    'Trainer profile misleading',
    'Session content not as described',
    'Trainer no-show',
  ],
  [ProblemType.BUG_REPORT]: [
    'UI element not responding',
    'Data not saving correctly',
    'Search function broken',
    'Filter options not working',
    'Map view glitching',
    'Notifications delayed',
    'App crashes on specific action',
    'Performance issues',
    'Display problems on device',
    'Feature not working as expected',
  ],
  [ProblemType.FEATURE_REQUEST]: [
    'Add Apple Watch integration',
    'Include nutrition tracking',
    'Social sharing features',
    'Advanced workout analytics',
    'Group booking functionality',
    'Workout plan templates',
    'Progress tracking graphs',
    'Integration with fitness apps',
    'Voice-guided workouts',
    'Offline mode support',
  ],
  [ProblemType.GENERAL]: [
    'General feedback',
    'Partnership inquiry',
    'Press/media inquiry',
    'How do I use this feature?',
    'Account security question',
    'Privacy policy question',
    'Terms of service inquiry',
    'Community guidelines',
    'Other inquiry',
    'Suggestion for improvement',
  ],
}

export function generateProblemData(userId: string, globalTicketNumber: number, supportAgents: any[] = []) {
  const type = faker.helpers.arrayElement(Object.values(ProblemType))
  const title = faker.helpers.arrayElement(PROBLEM_SUBJECTS[type as keyof typeof PROBLEM_SUBJECTS])

  const status = faker.helpers.weightedArrayElement([
    { weight: 20, value: ProblemStatus.OPEN },
    { weight: 15, value: ProblemStatus.ASSIGNED },
    { weight: 20, value: ProblemStatus.IN_PROGRESS },
    { weight: 10, value: ProblemStatus.WAITING_CUSTOMER },
    { weight: 5, value: ProblemStatus.WAITING_INTERNAL },
    { weight: 20, value: ProblemStatus.RESOLVED },
    { weight: 10, value: ProblemStatus.CLOSED },
  ])

  const priority = faker.helpers.weightedArrayElement([
    { weight: 20, value: ProblemPriority.LOW },
    { weight: 45, value: ProblemPriority.MEDIUM },
    { weight: 25, value: ProblemPriority.HIGH },
    { weight: 8, value: ProblemPriority.URGENT },
    { weight: 2, value: ProblemPriority.CRITICAL },
  ])

  return {
    userId,

    // Basic info
    title,
    description: generateProblemDescription(type, title),
    type,
    priority,
    status,

    // Ticket number (auto-generated format)
    ticketNumber: `TKT-${new Date().getFullYear()}${globalTicketNumber.toString().padStart(5, '0')}`,

    // Assignment (for certain statuses)
    assignedTo: [
      ProblemStatus.ASSIGNED,
      ProblemStatus.IN_PROGRESS,
      ProblemStatus.WAITING_CUSTOMER,
      ProblemStatus.WAITING_INTERNAL,
      ProblemStatus.RESOLVED,
    ].includes(status) && supportAgents.length > 0
      ? faker.helpers.arrayElement(supportAgents).id
      : null,

    // Resolution
    resolvedAt: [ProblemStatus.RESOLVED, ProblemStatus.CLOSED].includes(status)
      ? faker.date.recent({ days: 3 })
      : null,

    // Files (attachments)
    files: faker.datatype.boolean(0.3)
      ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
          faker.image.url()
        )
      : [],
  }
}

function generateProblemDescription(type: ProblemType, title: string): string {
  const intro = faker.helpers.arrayElement([
    'I am experiencing an issue where',
    'I need help with',
    'There seems to be a problem with',
    'I am unable to',
    'I am having trouble with',
  ])

  const details = faker.lorem.paragraph()

  const additionalInfo = faker.datatype.boolean(0.7)
    ? `\n\n${faker.helpers.arrayElement([
        'This started happening yesterday.',
        'I have tried restarting the app.',
        'This is urgent as I have a session tomorrow.',
        'Other users might be experiencing this too.',
        'I have attached screenshots.',
        'This worked fine last week.',
        'I am using the latest version of the app.',
      ])}`
    : ''

  const deviceInfo = faker.datatype.boolean(0.5)
    ? `\n\nDevice: ${faker.helpers.arrayElement(['iPhone 15', 'Samsung S23', 'Pixel 8'])}\nApp Version: ${faker.system.semver()}`
    : ''

  return `${intro} ${title.toLowerCase()}.\n\n${details}${additionalInfo}${deviceInfo}`
}

export function generateSupportCommentData(
  problemId: string,
  userId: string,
  isSupport: boolean,
  index: number
) {
  const isInternal = isSupport && faker.datatype.boolean(0.3)

  return {
    problemId,
    userId,

    // Content
    content: generateCommentContent(isSupport, isInternal, index),

    // Visibility
    isInternal,
  }
}

function generateCommentContent(isSupport: boolean, isInternal: boolean, index: number): string {
  if (isInternal) {
    return faker.helpers.arrayElement([
      'Escalating to technical team for investigation.',
      'Customer verified. Processing refund.',
      'Known issue - fix scheduled for next release.',
      'Reached out via phone. Issue resolved.',
      'Duplicate ticket. Merging with #12345.',
      'VIP customer - prioritizing resolution.',
      'Contacted development team for hotfix.',
      'Issue reproduced. Working on solution.',
      'Customer satisfied with resolution.',
      faker.lorem.sentence(),
    ])
  }

  if (isSupport) {
    if (index === 0) {
      return faker.helpers.arrayElement([
        'Thank you for contacting support. I understand your concern and I\'m here to help. Let me look into this for you.',
        'I\'m sorry to hear you\'re experiencing this issue. I\'ll investigate and get back to you shortly.',
        'Thank you for reporting this. I can see why this would be frustrating. Let me help you resolve this.',
        'I appreciate your patience. I\'ve received your request and I\'m working on a solution.',
      ])
    }

    return faker.helpers.arrayElement([
      'I\'ve checked your account and found the issue. Here\'s what I\'ll do to fix it...',
      'Can you please provide more details about when this started happening?',
      'I\'ve processed a refund for you. It should appear in 3-5 business days.',
      'This issue has been fixed. Please try again and let me know if you still have problems.',
      'I\'ve escalated this to our technical team. They\'ll investigate and update you soon.',
      'Could you please try clearing your app cache and let me know if that helps?',
      'I\'ve updated your account settings. The issue should be resolved now.',
      'Thank you for the additional information. This helps me understand the problem better.',
      faker.lorem.paragraph(),
    ])
  }

  // User comments
  return faker.helpers.arrayElement([
    'Any update on this issue?',
    'Thank you for your help!',
    'The problem is still happening. Here\'s what I see now...',
    'That fixed it! Thanks so much.',
    'I tried what you suggested but it didn\'t work.',
    'This is really affecting my ability to use the app.',
    'When can I expect this to be resolved?',
    'I appreciate your quick response.',
    'Here\'s a screenshot of the error I\'m seeing.',
    faker.lorem.paragraph(),
  ])
}