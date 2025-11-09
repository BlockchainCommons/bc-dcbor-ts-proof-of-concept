/**
 * Boolean value utilities for dCBOR.
 *
 * In TypeScript, boolean conversion is handled directly in encode.ts.
 * This file exists for 1:1 correspondence with Rust's bool_value.rs.
 *
 * @module bool-value
 */

import { Cbor, Simple } from './cbor';

/**
 * Check if a CBOR value is a boolean.
 */
export function isBoolean(cbor: Cbor): boolean {
  return cbor.type === 7 && (cbor.value === Simple.False || cbor.value === Simple.True);
}

/**
 * Extract boolean value from CBOR.
 * Throws if the value is not a boolean.
 */
export function asBoolean(cbor: Cbor): boolean {
  if (cbor.type === 7 && cbor.value === Simple.False) return false;
  if (cbor.type === 7 && cbor.value === Simple.True) return true;
  throw new Error('CBOR value is not a boolean');
}
