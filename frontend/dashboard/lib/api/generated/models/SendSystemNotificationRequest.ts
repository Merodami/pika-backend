/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Send system notification
 */
export type SendSystemNotificationRequest = {
    userIds?: Array<string>;
    /**
     * Send to all users
     */
    broadcast?: boolean;
    title: string;
    message: string;
    category: 'system' | 'security' | 'billing' | 'marketing';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    channels?: Array<'email' | 'inApp' | 'sms' | 'push'>;
    templateId?: string;
    templateVariables?: Record<string, any>;
    actionUrl?: string;
    /**
     * ISO 8601 datetime with timezone
     */
    expiresAt?: string;
    metadata?: Record<string, any>;
};

