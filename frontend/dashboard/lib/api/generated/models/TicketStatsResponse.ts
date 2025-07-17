/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Support ticket metrics
 */
export type TicketStatsResponse = {
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
    totalTickets: number;
    newTickets: number;
    resolvedTickets: number;
    /**
     * Average time to first response in minutes
     */
    averageFirstResponseTime: number;
    /**
     * Average resolution time in hours
     */
    averageResolutionTime: number;
    ticketsByStatus: {
        OPEN?: number;
        ASSIGNED?: number;
        IN_PROGRESS?: number;
        WAITING_CUSTOMER?: number;
        WAITING_INTERNAL?: number;
        RESOLVED?: number;
        CLOSED?: number;
    };
    ticketsByPriority: {
        LOW?: number;
        MEDIUM?: number;
        HIGH?: number;
        URGENT?: number;
        CRITICAL?: number;
    };
    ticketsByType: {
        BILLING?: number;
        TECHNICAL?: number;
        ACCOUNT?: number;
        GENERAL?: number;
        BUG_REPORT?: number;
        FEATURE_REQUEST?: number;
    };
    agentStats?: Array<{
        agentId: string;
        agentName: string;
        ticketsHandled: number;
        averageResponseTime: number;
        averageResolutionTime: number;
        satisfactionScore?: number;
    }>;
    averageSatisfaction?: number;
    satisfactionResponseRate?: number;
};

