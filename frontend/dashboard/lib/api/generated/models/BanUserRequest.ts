/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Ban a user
 */
export type BanUserRequest = {
    reason?: string;
    /**
     * Ban duration in days
     */
    duration?: number;
    notifyUser?: boolean;
};

