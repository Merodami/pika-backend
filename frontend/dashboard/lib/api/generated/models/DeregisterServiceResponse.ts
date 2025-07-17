/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Service deregistration confirmation
 */
export type DeregisterServiceResponse = {
    /**
     * Universally Unique Identifier
     */
    instanceId: string;
    serviceName: string;
    /**
     * ISO 8601 datetime with timezone
     */
    deregisteredAt: string;
    gracefulShutdown: boolean;
    message?: string;
};

