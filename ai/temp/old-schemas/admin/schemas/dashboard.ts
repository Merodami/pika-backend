import { z } from 'zod'

import { DateTime } from '../../common/schemas/primitives.js'
import { openapi } from '../../common/utils/openapi.js'

/**
 * Admin dashboard schemas
 */

export const DashboardStats = openapi(
  z.object({
    totalUsers: z.number().int().nonnegative(),
    activeUsers: z.number().int().nonnegative(),
    totalSessions: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    newUsersToday: z.number().int().nonnegative(),
    sessionsToday: z.number().int().nonnegative(),
    revenueToday: z.number().nonnegative(),
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
  }),
  {
    description: 'Dashboard statistics',
    example: {
      totalUsers: 1500,
      activeUsers: 850,
      totalSessions: 3200,
      totalRevenue: 125000,
      newUsersToday: 15,
      sessionsToday: 42,
      revenueToday: 3500,
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    },
  },
)

export type DashboardStats = z.infer<typeof DashboardStats>

export const DashboardStatsResponse = DashboardStats

export const RevenueChartResponse = openapi(
  z.object({
    data: z.array(
      z.object({
        date: DateTime,
        revenue: z.number().nonnegative(),
        sessions: z.number().int().nonnegative(),
      }),
    ),
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    total: z.number().nonnegative(),
  }),
  {
    description: 'Revenue chart data for dashboard',
    example: {
      data: [
        { date: new Date('2024-01-01'), revenue: 5000, sessions: 20 },
        { date: new Date('2024-01-02'), revenue: 7500, sessions: 30 },
      ],
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      total: 125000,
    },
  },
)

export type RevenueChartResponse = z.infer<typeof RevenueChartResponse>

export const UserGrowthResponse = openapi(
  z.object({
    data: z.array(
      z.object({
        date: DateTime,
        newUsers: z.number().int().nonnegative(),
        totalUsers: z.number().int().nonnegative(),
      }),
    ),
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    growthRate: z.number(),
  }),
  {
    description: 'User growth data for dashboard',
    example: {
      data: [
        { date: new Date('2024-01-01'), newUsers: 15, totalUsers: 1000 },
        { date: new Date('2024-01-02'), newUsers: 20, totalUsers: 1020 },
      ],
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      growthRate: 0.15,
    },
  },
)

export type UserGrowthResponse = z.infer<typeof UserGrowthResponse>

export const DashboardDateRangeParams = openapi(
  z.object({
    startDate: DateTime.optional(),
    endDate: DateTime.optional(),
    period: z.enum(['7d', '30d', '90d', '1y', 'custom']).optional(),
  }),
  {
    description: 'Date range parameters for dashboard queries',
    example: {
      period: '30d',
    },
  },
)

export type DashboardDateRangeParams = z.infer<typeof DashboardDateRangeParams>
