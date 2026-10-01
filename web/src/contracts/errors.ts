// Parser errors (docs/CONTRACTS.md §1). The code list is closed.

export const PARSE_ERROR_CODES = [
  "json-syntax", "not-object", "format", "schema-version", "missing-key", "unknown-key", "type", "not-integer",
  "range", "empty", "too-long", "enum", "hex", "unknown-id", "duplicate", "inconsistent",
] as const;
export type ParseErrorCode = (typeof PARSE_ERROR_CODES)[number];

export interface ParseError {
  /** Dot and index notation, e.g. `principles[2].params.minPx`; "" for the whole file. */
  path: string;
  code: ParseErrorCode;
  /** en-GB: what is wrong and what to do. */
  message: string;
}
