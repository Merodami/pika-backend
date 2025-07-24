/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Update multiple users at once
 */
export type BulkUserActionRequest = {
    userIds: Array<string>;
    updates: {
        status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
    };
    reason: string;
};

