/**
 * Standard library re-exports and compatibility layer.
 *
 * This file exists for 1:1 correspondence with Rust's stdlib.rs.
 * In Rust, this handles std/no_std feature flags.
 * In TypeScript, this is primarily documentation.
 *
 * @module stdlib
 */

// TypeScript/JavaScript runs in various environments (Node.js, browsers, Deno, etc.)
// All necessary standard library features are available natively.

/**
 * Check if running in Node.js environment.
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' &&
         // eslint-disable-next-line no-undef
         process.versions != null &&
         // eslint-disable-next-line no-undef
         process.versions.node != null;
}

/**
 * Check if running in browser environment.
 */
export function isBrowser(): boolean {
  // eslint-disable-next-line no-undef
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in Deno environment.
 */
export function isDeno(): boolean {
  return typeof (globalThis as unknown as { Deno?: unknown }).Deno !== 'undefined';
}

/**
 * Concatenate multiple byte arrays into one.
 */
export function concatBytes(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Check if two byte arrays are equal.
 */
export function areBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Lexicographically compare two byte arrays.
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function lexicographicallyCompareBytes(a: Uint8Array, b: Uint8Array): number {
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  return 0;
}
