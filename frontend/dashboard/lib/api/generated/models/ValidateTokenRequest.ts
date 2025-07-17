/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Validate JWT token
 */
export type ValidateTokenRequest = {
    token: string;
    checkExpiry?: boolean;
    requiredRoles?: Array<string>;
};

