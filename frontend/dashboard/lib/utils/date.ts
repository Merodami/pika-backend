import dayjs from 'dayjs'

/**
 * Format a date for display in the UI
 * Accepts ISO 8601 datetime strings from the API, Date objects, or null/undefined
 * @param date - ISO datetime string, Date object, or null/undefined
 * @param format - dayjs format string (default: 'MMM DD, YYYY')
 * @returns Formatted date string or fallback value
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: string = 'MMM DD, YYYY'
): string {
  if (!date) return 'N/A'

  try {
    const dateObj = dayjs(date)

    if (!dateObj.isValid()) {
      return 'Invalid date'
    }

    return dateObj.format(format)
  } catch (error) {
    console.error('Date formatting error:', error)
    return typeof date === 'string' ? date : 'Invalid date'
  }
}

/**
 * Format a date range for display
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @param format - dayjs format string
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  format: string = 'MMM DD, YYYY'
): string {
  const start = formatDate(startDate, format)
  const end = formatDate(endDate, format)

  if (start === 'N/A' && end === 'N/A') {
    return 'No date range specified'
  }

  if (start === 'N/A') {
    return `Until ${end}`
  }

  if (end === 'N/A') {
    return `From ${start}`
  }

  return `${start} - ${end}`
}

/**
 * Format a datetime with time included
 * @param date - ISO datetime string or Date object
 * @returns Formatted datetime string with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'MMM DD, YYYY HH:mm')
}

/**
 * Format a date in relative terms (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeDate(
  date: string | Date | null | undefined
): string {
  if (!date) return 'N/A'

  try {
    const dateObj = dayjs(date)
    const now = dayjs()

    if (!dateObj.isValid()) {
      return 'Invalid date'
    }

    const diffInDays = dateObj.diff(now, 'day')

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Tomorrow'
    } else if (diffInDays === -1) {
      return 'Yesterday'
    } else if (diffInDays > 0) {
      return `In ${diffInDays} days`
    } else {
      return `${Math.abs(diffInDays)} days ago`
    }
  } catch {
    return formatDate(date)
  }
}

/**
 * Convert a Date object or string to ISO 8601 format for API requests
 * @param date - Date object, ISO string, or null/undefined
 * @returns ISO 8601 datetime string or null
 */
export function toISOString(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null

  try {
    const dateObj = dayjs(date)
    return dateObj.isValid() ? dateObj.toISOString() : null
  } catch {
    return null
  }
}
