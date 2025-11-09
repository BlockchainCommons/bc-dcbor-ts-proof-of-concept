/**
 * Array conversion utilities for dCBOR.
 *
 * In TypeScript, array conversion is handled directly in encode.ts.
 * This file exists for 1:1 correspondence with Rust's array.rs.
 *
 * @module array
 */

import { Cbor, MajorType } from './cbor';

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
