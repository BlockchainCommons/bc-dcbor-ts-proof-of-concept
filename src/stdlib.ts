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
         process.versions != null &&
         process.versions.node != null;
}

/**
 * Check if running in browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in Deno environment.
 */
export function isDeno(): boolean {
  return typeof Deno !== 'undefined';
}
