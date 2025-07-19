/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Push notification result
 */
export type SendPushNotificationResponse = {
    sent: number;
    failed: number;
    failures?: Array<{
        userId: string;
        reason: string;
    }>;
};

