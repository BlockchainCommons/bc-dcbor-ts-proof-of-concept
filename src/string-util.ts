/**
 * String utilities for dCBOR, including Unicode normalization.
 *
 * This file exists for 1:1 correspondence with Rust's string_util.rs.
 *
 * @module string-util
 */

/**
 * Flank a string with left and right strings.
 *
 * @param s - String to flank
 * @param left - Left flanking string
 * @param right - Right flanking string
 * @returns Flanked string
 */
export function flanked(s: string, left: string, right: string): string {
  return left + s + right;
}

/**
 * Check if a character is printable.
 *
 * @param c - Character to check
 * @returns True if printable
 */
export function isPrintable(c: string): boolean {
  if (c.length !== 1) return false;
  const code = c.charCodeAt(0);
  // Non-ASCII or ASCII printable (32-126)
  return code > 127 || (code >= 32 && code <= 126);
}

/**
 * Sanitize a string by replacing non-printable characters with dots.
 * Returns None if the string has no printable characters.
 *
 * @param str - String to sanitize
 * @returns Sanitized string or undefined if no printable characters
 */
export function sanitized(str: string): string | undefined {
  let hasPrintable = false;
  const chars: string[] = [];

  for (const c of str) {
    if (isPrintable(c)) {
      hasPrintable = true;
      chars.push(c);
    } else {
      chars.push('.');
    }
  }

  if (!hasPrintable) {
    return undefined;
  }

  return chars.join('');
}

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
