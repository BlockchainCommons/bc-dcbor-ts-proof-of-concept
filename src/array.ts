/**
 * Array conversion utilities for dCBOR.
 *
 * This file exists for 1:1 correspondence with Rust's array.rs.
 *
 * @module array
 */

import { Cbor, MajorType, cborData } from './cbor';
import { lexicographicallyCompareBytes } from './stdlib';

/**
 * Check if a CBOR value is an array.
 */
export function isArray(cbor: Cbor): cbor is { isCbor: true; type: MajorType.Array; value: Cbor[] } {
  return cbor.type === MajorType.Array;
}

/**
 * Extract array elements from CBOR array.
 * Throws if the value is not an array.
 */
export function asArray(cbor: Cbor): Cbor[] {
  if (!isArray(cbor)) {
    throw new Error('CBOR value is not an array');
  }
  return cbor.value;
}

/**
 * Sort an array by its CBOR encoding.
 *
 * This function sorts array elements based on their canonical CBOR byte
 * representation, which is required for deterministic encoding of sets
 * and other structures where element order matters.
 *
 * @param array - Array of values to sort
 * @returns New array sorted by CBOR encoding
 *
 * @example
 * ```typescript
 * const sorted = sortArrayByCborEncoding([3, 1, 2]);
 * // Returns [1, 2, 3] (sorted by CBOR byte representation)
 *
 * const mixed = sortArrayByCborEncoding(["hello", 42, true]);
 * // Returns elements sorted by their CBOR encoding
 * ```
 */
export function sortArrayByCborEncoding<T>(array: T[]): T[] {
  const pairs: [Uint8Array, T][] = array.map(item => [cborData(item), item]);
  pairs.sort((a, b) => lexicographicallyCompareBytes(a[0], b[0]));
  return pairs.map(([_, item]) => item);
}
