/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Transactional email result
 */
export type SendTransactionalEmailResponse = {
    messageId: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained' | 'rejected';
    /**
     * ISO 8601 datetime with timezone
     */
    scheduledAt?: string;
    errorMessage?: string;
};

