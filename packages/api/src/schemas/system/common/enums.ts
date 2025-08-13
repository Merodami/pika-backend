import {
  AlertSeverity as AlertSeverityEnum,
  LogLevel as LogLevelEnum,
  MaintenanceStatus as MaintenanceStatusEnum,
  MaintenanceType as MaintenanceTypeEnum,
  SystemComponentType as SystemComponentTypeEnum,
  SystemMetricType as SystemMetricTypeEnum,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * System service enum schemas
 */

export const SystemComponentTypeSchema = openapi(
  createZodEnum(SystemComponentTypeEnum),
  {
    description: 'System component type for monitoring',
    example: SystemComponentTypeEnum.DATABASE,
  },
)
export type SystemComponentType = z.infer<typeof SystemComponentTypeSchema>

export const MaintenanceTypeSchema = openapi(
  createZodEnum(MaintenanceTypeEnum),
  {
    description: 'Type of maintenance operation',
    example: MaintenanceTypeEnum.SCHEDULED,
  },
)
export type MaintenanceType = z.infer<typeof MaintenanceTypeSchema>

export const MaintenanceStatusSchema = openapi(
  createZodEnum(MaintenanceStatusEnum),
  {
    description: 'Status of maintenance operation',
    example: MaintenanceStatusEnum.SCHEDULED,
  },
)
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>

export const LogLevelSchema = openapi(createZodEnum(LogLevelEnum), {
  description: 'Log level for system logging',
  example: LogLevelEnum.INFO,
})
export type LogLevel = z.infer<typeof LogLevelSchema>

export const AlertSeveritySchema = openapi(createZodEnum(AlertSeverityEnum), {
  description: 'Severity level of system alerts',
  example: AlertSeverityEnum.MEDIUM,
})
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>

export const SystemMetricTypeSchema = openapi(
  createZodEnum(SystemMetricTypeEnum),
  {
    description: 'Type of system metric for monitoring',
    example: SystemMetricTypeEnum.CPU_USAGE,
  },
)
export type SystemMetricType = z.infer<typeof SystemMetricTypeSchema>
