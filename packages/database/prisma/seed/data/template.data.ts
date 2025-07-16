/**
 * Template seed data for communication templates
 */

import { faker } from '@faker-js/faker'

export const EMAIL_TEMPLATES = [
  {
    name: 'welcome-email',
    type: 'email',
    category: 'onboarding',
    externalId: 'emailjs_welcome_v1',
    subject: 'Welcome to Pika!',
    body: 'Hi {{firstName}}, Welcome to Pika! We\'re excited to have you join our fitness community...',
    variables: {
      firstName: 'string',
      email: 'string',
    },
  },
  {
    name: 'session-reminder',
    type: 'email',
    category: 'session',
    externalId: 'emailjs_session_reminder_v1',
    subject: 'Reminder: Your session starts in 1 hour',
    body: 'Hi {{firstName}}, This is a reminder that your session "{{sessionTitle}}" starts at {{startTime}}...',
    variables: {
      firstName: 'string',
      sessionTitle: 'string',
      startTime: 'string',
      gymName: 'string',
      gymAddress: 'string',
    },
  },
  {
    name: 'session-cancelled',
    type: 'email',
    category: 'session',
    externalId: 'emailjs_session_cancelled_v1',
    subject: 'Session Cancelled',
    body: 'Hi {{firstName}}, Unfortunately, your session "{{sessionTitle}}" has been cancelled...',
    variables: {
      firstName: 'string',
      sessionTitle: 'string',
      reason: 'string',
      refundAmount: 'number',
    },
  },
  {
    name: 'payment-successful',
    type: 'email',
    category: 'payment',
    externalId: 'emailjs_payment_success_v1',
    subject: 'Payment Confirmation',
    body: 'Hi {{firstName}}, We\'ve successfully processed your payment of {{amount}} {{currency}}...',
    variables: {
      firstName: 'string',
      amount: 'number',
      currency: 'string',
      description: 'string',
      invoiceUrl: 'string',
    },
  },
  {
    name: 'password-reset',
    type: 'email',
    category: 'auth',
    externalId: 'emailjs_password_reset_v1',
    subject: 'Reset Your Password',
    body: 'Hi {{firstName}}, You requested to reset your password. Click here to reset: {{resetLink}}...',
    variables: {
      firstName: 'string',
      resetLink: 'string',
      expiresIn: 'string',
    },
  },
]

export const SMS_TEMPLATES = [
  {
    name: 'session-reminder-sms',
    type: 'sms',
    category: 'session',
    externalId: 'twilio_session_reminder_v1',
    subject: null,
    body: 'Pika: Your session "{{sessionTitle}}" starts in 1 hour at {{gymName}}. See you there!',
    variables: {
      sessionTitle: 'string',
      gymName: 'string',
    },
  },
  {
    name: 'verification-code-sms',
    type: 'sms',
    category: 'auth',
    externalId: 'twilio_verification_v1',
    subject: null,
    body: 'Pika: Your verification code is {{code}}. Valid for 10 minutes.',
    variables: {
      code: 'string',
    },
  },
]

export const PUSH_TEMPLATES = [
  {
    name: 'new-follower-push',
    type: 'push',
    category: 'social',
    externalId: 'fcm_new_follower_v1',
    subject: 'New Follower',
    body: '{{followerName}} started following you',
    variables: {
      followerName: 'string',
      followerId: 'string',
    },
  },
  {
    name: 'session-starting-push',
    type: 'push',
    category: 'session',
    externalId: 'fcm_session_starting_v1',
    subject: 'Session Starting Soon',
    body: 'Your session starts in 15 minutes!',
    variables: {
      sessionTitle: 'string',
      startTime: 'string',
    },
  },
]

export function generateTemplateData(index: number) {
  const allTemplates = [...EMAIL_TEMPLATES, ...SMS_TEMPLATES, ...PUSH_TEMPLATES]
  const template = allTemplates[index % allTemplates.length]

  return {
    name: template.name,
    type: template.type,
    category: template.category,
    externalId: template.externalId,
    subject: template.subject,
    body: template.body,
    description: faker.lorem.sentence(),
    variables: template.variables,
    metadata: {
      version: 1,
      lastUpdated: faker.date.recent({ days: 30 }),
      usage: faker.number.int({ min: 0, max: 1000 }),
    },
    isActive: faker.datatype.boolean(0.95),
  }
}