/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Send SMS message
 */
export type SendSMSRequest = {
    userId: string;
    /**
     * Override user phone
     */
    phoneNumber?: string;
    message: string;
    type: 'verification' | 'alert' | 'reminder' | 'marketing';
    metadata?: Record<string, any>;
};

