/**
 * Standard library re-exports and compatibility layer.
 *
 * In Rust, this handles std/no_std feature flags.
 * In TypeScript, this is primarily documentation.
 *
 * @module stdlib
 */

/**
 * Check if running in a Node.js environment.
 */
export function isNode(): boolean {
  // Global checks for cross-platform compatibility
  // eslint-disable-next-line no-restricted-globals
  return typeof process !== 'undefined' &&
         // eslint-disable-next-line no-undef, no-restricted-globals
         process.versions?.node != null;
}

/**
 * Check if running in a browser environment.
 */
export function isBrowser(): boolean {
  // Global checks for cross-platform compatibility
  // eslint-disable-next-line no-undef, no-restricted-globals
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in the Deno environment.
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
    const aVal = a[i];
    const bVal = b[i];
    if (aVal === undefined || bVal === undefined) {
      throw new Error('Unexpected undefined byte in array');
    }
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }
  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  return 0;
}
