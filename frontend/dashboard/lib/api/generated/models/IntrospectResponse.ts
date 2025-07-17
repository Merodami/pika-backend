/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Token introspection response
 */
export type IntrospectResponse = {
    /**
     * Whether token is active
     */
    active: boolean;
    /**
     * Token scopes
     */
    scope?: string;
    /**
     * User email
     */
    username?: string;
    tokenType?: 'Bearer';
    /**
     * Expiration time (Unix timestamp)
     */
    exp?: number;
    /**
     * Issued at (Unix timestamp)
     */
    iat?: number;
    /**
     * Subject (user ID)
     */
    sub?: string;
    /**
     * User ID
     */
    userId?: string;
    /**
     * User email
     */
    userEmail?: string;
    userRole?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
};

