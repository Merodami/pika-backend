import { set } from 'lodash-es'
import { QueryConfig } from 'pg'

/**
 * Only allow alphanumeric + underscore, and must start with a letter or underscore.
 * Prevents SQL injection via identifiers.
 */
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * ISO 8601 date-time strict pattern
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * Throws if `ident` is not a safe SQL identifier.
 */
function assertValidIdentifier(ident: string): void {
  if (!IDENTIFIER_PATTERN.test(ident)) {
    throw new Error(`Invalid SQL identifier: "${ident}"`)
  }
}

/**
 * Wraps a validated identifier in double quotes for use in SQL.
 */
function quoteIdentifier(ident: string): string {
  assertValidIdentifier(ident)

  return `"${ident}"`
}

/**
 * A piece of SQL plus its parameters.
 */
export interface SQLFragment {
  text: string
  values: unknown[]
}

/**
 * Builds a case-insensitive LIKE filter:
 *   column ILIKE '%' || $1 || '%'
 * Returns empty fragment if no value.
 */
export function buildTextFilter(
  column: string,
  value?: string,
  paramStartIndex = 1,
): SQLFragment {
  assertValidIdentifier(column)

  if (typeof value !== 'string') {
    return { text: '', values: [] }
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return { text: '', values: [] }
  }

  // Escape user input for LIKE (%, _, etc.)
  const escaped = trimmed.replace(/[%_]/g, '\\$&')
  const placeholder = `$${paramStartIndex}`

  return {
    text: `${quoteIdentifier(column)} ILIKE '%' || ${placeholder} || '%' ESCAPE '\\'`,
    values: [escaped],
  }
}

/**
 * Builds a numeric range filter:
 *   column = $1
 *   column >= $1
 *   column <= $2
 * etc.
 */
export function buildRangeFilter(
  column: string,
  criteria: { exact?: number; min?: number; max?: number },
  paramStartIndex = 1,
): SQLFragment {
  assertValidIdentifier(column)

  const { exact, min, max } = criteria ?? {}

  if (typeof exact === 'number') {
    return {
      text: `${quoteIdentifier(column)} = $${paramStartIndex}`,
      values: [exact],
    }
  }

  const clauses: string[] = []
  const values: unknown[] = []

  if (typeof min === 'number') {
    clauses.push(
      `${quoteIdentifier(column)} >= $${paramStartIndex + values.length}`,
    )
    values.push(min)
  }
  if (typeof max === 'number') {
    clauses.push(
      `${quoteIdentifier(column)} <= $${paramStartIndex + values.length}`,
    )
    values.push(max)
  }
  if (!clauses.length) {
    return { text: '', values: [] }
  }

  return {
    text: clauses.join(' AND '),
    values,
  }
}

/**
 * Builds a SELECT projection list.
 * If empty, returns '*' (all columns).
 */
export function buildProjection(fields: string[] = []): string {
  if (!Array.isArray(fields) || fields.length === 0) {
    return '*'
  }

  return fields.map((f) => quoteIdentifier(f)).join(', ')
}

/**
 * Ensures a row object has all required properties.
 * Throws if missing or not an object.
 */
export function assertRow<T>(
  row: Record<string, unknown> | null,
  requiredFields: string[],
): T {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Row is not an object')
  }

  for (const f of requiredFields) {
    if (!(f in row)) {
      throw new Error(`Missing required column "${f}" in row`)
    }
  }

  return row as T
}

/**
 * Converts any string properties matching ISO_DATE_PATTERN to Date.
 * Returns a shallow copy.
 */
export function convertDateStrings(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const out: Record<string, unknown> = { ...obj }

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && ISO_DATE_PATTERN.test(val)) {
      const d = new Date(val)

      if (!isNaN(d.getTime())) {
        set(out, key, d)
      }
    }
  }

  return out
}

/**
 * Example: assembling a WHERE clause safely
 */
export function assembleWhere(fragments: SQLFragment[]): QueryConfig {
  const clauses = fragments
    .map((f) => f.text)
    .filter(Boolean)
    .join(' AND ')
  const text = clauses ? `WHERE ${clauses}` : ''
  const values = fragments.flatMap((f) => f.values)

  return { text, values }
}
