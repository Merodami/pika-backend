/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create a new notification
 */
export type CreateNotificationRequest = {
    userId?: string;
    /**
     * Subscription token for push notifications
     */
    subToken?: string;
    type?: 'email' | 'inApp' | 'sms' | 'push';
    title?: string;
    description: string;
    isGlobal?: boolean;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
    actionUrl?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
    /**
     * ISO 8601 datetime with timezone
     */
    expiresAt?: string;
};

