/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create notification result
 */
export type CreateNotificationResponse = {
    id: string;
    userId: string;
    title: string;
    description: string;
    type: string;
    isRead: boolean;
    isGlobal?: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt?: string;
};

