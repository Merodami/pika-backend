/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Webhook error response
 */
export type WebhookErrorResponse = {
    error: {
        code: 'INVALID_SIGNATURE' | 'PROCESSING_ERROR' | 'UNKNOWN_EVENT_TYPE';
        message: string;
        eventId?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        timestamp: string;
    };
};

