/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Send transactional email
 */
export type SendTransactionalEmailRequest = {
    userId: string;
    templateKey: 'welcome' | 'passwordReset' | 'emailVerification' | 'paymentSuccess' | 'paymentFailed' | 'subscriptionActivated' | 'subscriptionCancelled';
    variables: Record<string, any>;
    /**
     * Override template subject
     */
    subject?: string;
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        /**
         * Base64 encoded
         */
        content: string;
        contentType: string;
    }>;
    /**
     * ISO 8601 datetime with timezone
     */
    sendAt?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
};

