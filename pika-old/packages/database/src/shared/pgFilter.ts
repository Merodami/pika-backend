// Only allow letters, numbers and underscore, and must start with letter/underscore
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Throws if the given string isn’t a safe SQL identifier. */
export function assertValidIdentifier(ident: string): void {
  if (!IDENTIFIER_PATTERN.test(ident)) {
    throw new Error(`Invalid SQL identifier: "${ident}"`)
  }
}

/** Wraps a validated identifier in double-quotes for safe use in SQL. */
export function quoteIdentifier(ident: string): string {
  assertValidIdentifier(ident)

  return `"${ident}"`
}
