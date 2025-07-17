/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create a service-to-service session
 */
export type CreateServiceSessionRequest = {
    userId: string;
    serviceName: string;
    expiresIn?: number;
    metadata?: Record<string, any>;
};

