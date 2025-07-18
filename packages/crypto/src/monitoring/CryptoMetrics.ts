/**
 * Production monitoring and metrics collection for crypto operations
 * Provides detailed observability for security and performance tracking
 */

export interface MetricValue {
  value: number
  timestamp: Date
  labels?: Record<string, string>
}

export interface HistogramBucket {
  le: number // less than or equal
  count: number
}

export interface HistogramMetric {
  buckets: HistogramBucket[]
  count: number
  sum: number
  labels?: Record<string, string>
}

export interface CounterMetric {
  value: number
  labels?: Record<string, string>
}

export interface GaugeMetric {
  value: number
  labels?: Record<string, string>
}

/**
 * Crypto operation metrics collector
 * Compatible with Prometheus and other monitoring systems
 */
export class CryptoMetrics {
  private counters = new Map<string, CounterMetric>()
  private histograms = new Map<string, HistogramMetric>()
  private gauges = new Map<string, GaugeMetric>()

  // Standard histogram buckets for latency (milliseconds)
  private static readonly LATENCY_BUCKETS = [
    1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
  ]

  constructor(private readonly prefix: string = 'crypto_') {}

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    labels?: Record<string, string>,
    value: number = 1,
  ): void {
    const key = this.getMetricKey(name, labels)
    const existing = this.counters.get(key) || { value: 0, labels }

    existing.value += value
    this.counters.set(key, existing)
  }

  /**
   * Record a histogram measurement (typically for latency)
   */
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const key = this.getMetricKey(name, labels)

    let histogram = this.histograms.get(key)

    if (!histogram) {
      histogram = {
        buckets: CryptoMetrics.LATENCY_BUCKETS.map((le) => ({ le, count: 0 })),
        count: 0,
        sum: 0,
        labels,
      }
      this.histograms.set(key, histogram)
    }

    // Update histogram buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++
      }
    }

    histogram.count++
    histogram.sum += value
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels)

    this.gauges.set(key, { value, labels })
  }

  /**
   * Get current metric values (for Prometheus export)
   */
  getMetrics(): {
    counters: Map<string, CounterMetric>
    histograms: Map<string, HistogramMetric>
    gauges: Map<string, GaugeMetric>
  } {
    return {
      counters: new Map(this.counters),
      histograms: new Map(this.histograms),
      gauges: new Map(this.gauges),
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = []

    // Export counters
    for (const [key, metric] of this.counters) {
      const labelStr = this.formatLabels(metric.labels)

      lines.push(`# TYPE ${this.prefix}${this.extractMetricName(key)} counter`)
      lines.push(
        `${this.prefix}${this.extractMetricName(key)}${labelStr} ${metric.value}`,
      )
    }

    // Export histograms
    for (const [key, metric] of this.histograms) {
      const baseName = this.extractMetricName(key)
      const labelStr = this.formatLabels(metric.labels)

      lines.push(`# TYPE ${this.prefix}${baseName} histogram`)

      // Histogram buckets
      for (const bucket of metric.buckets) {
        const bucketLabels = { ...metric.labels, le: bucket.le.toString() }
        const bucketLabelStr = this.formatLabels(bucketLabels)

        lines.push(
          `${this.prefix}${baseName}_bucket${bucketLabelStr} ${bucket.count}`,
        )
      }

      // Histogram count and sum
      lines.push(`${this.prefix}${baseName}_count${labelStr} ${metric.count}`)
      lines.push(`${this.prefix}${baseName}_sum${labelStr} ${metric.sum}`)
    }

    // Export gauges
    for (const [key, metric] of this.gauges) {
      const labelStr = this.formatLabels(metric.labels)

      lines.push(`# TYPE ${this.prefix}${this.extractMetricName(key)} gauge`)
      lines.push(
        `${this.prefix}${this.extractMetricName(key)}${labelStr} ${metric.value}`,
      )
    }

    return lines.join('\n') + '\n'
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.counters.clear()
    this.histograms.clear()
    this.gauges.clear()
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    const labelStr = labels ? JSON.stringify(labels) : ''

    return `${name}${labelStr}`
  }

  private extractMetricName(key: string): string {
    return key.split('{')[0]
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return ''
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',')

    return `{${labelPairs}}`
  }
}

/**
 * Global crypto metrics instance
 */
export const globalCryptoMetrics = new CryptoMetrics('pika_crypto_')

/**
 * Standard crypto operation metrics
 */
export const CryptoMetricNames = {
  // Token operations
  TOKEN_GENERATION_TOTAL: 'token_generation_total',
  TOKEN_GENERATION_DURATION: 'token_generation_duration_ms',
  TOKEN_VALIDATION_TOTAL: 'token_validation_total',
  TOKEN_VALIDATION_DURATION: 'token_validation_duration_ms',
  TOKEN_VALIDATION_ERRORS: 'token_validation_errors_total',

  // Key operations
  KEY_GENERATION_TOTAL: 'key_generation_total',
  KEY_GENERATION_DURATION: 'key_generation_duration_ms',
  KEY_ROTATION_TOTAL: 'key_rotation_total',
  KEY_ROTATION_DURATION: 'key_rotation_duration_ms',
  ACTIVE_KEYS: 'active_keys_count',

  // QR operations
  QR_GENERATION_TOTAL: 'qr_generation_total',
  QR_GENERATION_DURATION: 'qr_generation_duration_ms',
  QR_VALIDATION_TOTAL: 'qr_validation_total',
  QR_CACHE_HITS: 'qr_cache_hits_total',
  QR_CACHE_MISSES: 'qr_cache_misses_total',

  // Short code operations
  SHORT_CODE_GENERATION_TOTAL: 'short_code_generation_total',
  SHORT_CODE_VALIDATION_TOTAL: 'short_code_validation_total',
  SHORT_CODE_EXTRACTION_ERRORS: 'short_code_extraction_errors_total',

  // Redis operations
  REDIS_OPERATIONS_TOTAL: 'redis_operations_total',
  REDIS_OPERATION_DURATION: 'redis_operation_duration_ms',
  REDIS_CONNECTION_ERRORS: 'redis_connection_errors_total',

  // Security events
  SECURITY_VIOLATIONS: 'security_violations_total',
  RATE_LIMIT_HITS: 'rate_limit_hits_total',
  SUSPICIOUS_ACTIVITIES: 'suspicious_activities_total',
} as const

/**
 * Decorator for measuring method execution time
 */
export function measureDuration(
  metricName: string,
  labels?: Record<string, string>,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const finalLabels = {
        ...labels,
        method: `${target.constructor.name}.${propertyName}`,
      }

      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime

        globalCryptoMetrics.recordHistogram(metricName, duration, finalLabels)
        globalCryptoMetrics.incrementCounter(
          metricName.replace('_duration_ms', '_total'),
          { ...finalLabels, status: 'success' },
        )

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        globalCryptoMetrics.recordHistogram(metricName, duration, finalLabels)
        globalCryptoMetrics.incrementCounter(
          metricName.replace('_duration_ms', '_total'),
          { ...finalLabels, status: 'error' },
        )

        throw error
      }
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>()

  /**
   * Start a performance timer
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now())
  }

  /**
   * End a performance timer and record the duration
   */
  static endTimer(
    name: string,
    metricName: string,
    labels?: Record<string, string>,
  ): number {
    const startTime = this.timers.get(name)

    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`)
    }

    const duration = Date.now() - startTime

    this.timers.delete(name)

    globalCryptoMetrics.recordHistogram(metricName, duration, labels)

    return duration
  }

  /**
   * Measure async operation duration
   */
  static async measure<T>(
    operation: () => Promise<T>,
    metricName: string,
    labels?: Record<string, string>,
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      globalCryptoMetrics.recordHistogram(metricName, duration, labels)
      globalCryptoMetrics.incrementCounter(
        metricName.replace('_duration_ms', '_total'),
        { ...labels, status: 'success' },
      )

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      globalCryptoMetrics.recordHistogram(metricName, duration, labels)
      globalCryptoMetrics.incrementCounter(
        metricName.replace('_duration_ms', '_total'),
        { ...labels, status: 'error' },
      )

      throw error
    }
  }
}
