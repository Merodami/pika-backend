/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Individual agent performance metrics
 */
export type AgentPerformanceResponse = {
    agentId: string;
    agentName: string;
    period: {
        /**
         * ISO 8601 datetime with timezone
         */
        start: string;
        /**
         * ISO 8601 datetime with timezone
         */
        end: string;
    };
    ticketsHandled: number;
    ticketsResolved: number;
    /**
     * In minutes
     */
    averageResponseTime: number;
    /**
     * In hours
     */
    averageResolutionTime: number;
    satisfactionScore?: number;
    firstContactResolutionRate: number;
};

