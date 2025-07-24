/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create new user for registration with full profile data
 */
export type CreateUserRequest = {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    /**
     * ISO 8601 datetime with timezone
     */
    dateOfBirth?: string;
    description?: string;
    specialties?: Array<string>;
    acceptTerms: boolean;
    marketingConsent?: boolean;
    role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
    avatarUrl?: string;
};

