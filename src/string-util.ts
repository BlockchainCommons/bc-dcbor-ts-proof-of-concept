/**
 * String utilities for dCBOR, including Unicode normalization.
 *
 * This file exists for 1:1 correspondence with Rust's string_util.rs.
 * Unicode NFC normalization logic is in encode.ts/decode.ts.
 *
 * @module string-util
 */

/**
 * Normalize string to Unicode NFC (Canonical Composition) form.
 * dCBOR requires all text strings to be in NFC form for deterministic encoding.
 */
export function toNFC(str: string): string {
  return str.normalize('NFC');
}

/**
 * Check if a string is in Unicode NFC form.
 */
export function isNFC(str: string): boolean {
  return str === str.normalize('NFC');
}

/**
 * Validate that a string is in NFC form.
 * Throws an error if not.
 */
export function validateNFC(str: string): void {
  if (!isNFC(str)) {
    throw new Error('String is not in Unicode NFC form');
  }
}
