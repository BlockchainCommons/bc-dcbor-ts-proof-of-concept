/**
 * Integer utilities for dCBOR.
 *
 * In TypeScript, integer encoding/decoding is handled in encode.ts and decode.ts.
 *
 * @module int
 */

import { type Cbor, MajorType } from './cbor';

/**
 * Check if a CBOR value is an unsigned integer.
 */
export function isUnsigned(cbor: Cbor): boolean {
  return cbor.type === MajorType.Unsigned;
}

/**
 * Check if a CBOR value is a negative integer.
 */
export function isNegative(cbor: Cbor): boolean {
  return cbor.type === MajorType.Negative;
}

/**
 * Check if a CBOR value is any integer (unsigned or negative).
 */
export function isInteger(cbor: Cbor): boolean {
  return isUnsigned(cbor) || isNegative(cbor);
}

/**
 * Extract the numeric value from CBOR integer.
 * Works for both unsigned and negative integers.
 * Throws if the value is not an integer.
 */
export function asInteger(cbor: Cbor): number | bigint {
  if (cbor.type === MajorType.Unsigned) {
    return cbor.value;
  }
  if (cbor.type === MajorType.Negative) {
    // Negative integers store magnitude, actual value is -(magnitude + 1)
    if (typeof cbor.value === 'bigint') {
      return -(cbor.value + 1n);
    }
    return -(cbor.value + 1);
  }
  throw new Error('CBOR value is not an integer');
}
