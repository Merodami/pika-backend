/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ServiceHealth = {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    /**
     * Service URL
     */
    url: string;
    /**
     * Response time in milliseconds
     */
    responseTime: number;
};

