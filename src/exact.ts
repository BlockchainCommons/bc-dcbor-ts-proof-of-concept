/**
 * Exact type conversions for CBOR values.
 *
 * This file exists for 1:1 correspondence with Rust's exact.rs.
 * Provides safe extraction of values with type checking.
 *
 * @module exact
 */

import { Cbor, MajorType } from './cbor';

/**
 * Extract exact unsigned integer value.
 * Returns undefined if not an unsigned integer.
 */
export function exactUnsigned(cbor: Cbor): number | bigint | undefined {
  if (cbor.type === MajorType.Unsigned) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract exact negative integer value (as actual negative number).
 * Returns undefined if not a negative integer.
 */
export function exactNegative(cbor: Cbor): number | bigint | undefined {
  if (cbor.type === MajorType.Negative) {
    if (typeof cbor.value === 'bigint') {
      return -(cbor.value + 1n);
    }
    return -(cbor.value + 1);
  }
  return undefined;
}

/**
 * Extract exact integer value (unsigned or negative).
 * Returns undefined if not an integer.
 */
export function exactInteger(cbor: Cbor): number | bigint | undefined {
  return exactUnsigned(cbor) ?? exactNegative(cbor);
}

/**
 * Extract exact string value.
 * Returns undefined if not a text string.
 */
export function exactString(cbor: Cbor): string | undefined {
  if (cbor.type === MajorType.Text) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract exact byte string value.
 * Returns undefined if not a byte string.
 */
export function exactBytes(cbor: Cbor): Uint8Array | undefined {
  if (cbor.type === MajorType.ByteString) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract exact array value.
 * Returns undefined if not an array.
 */
export function exactArray(cbor: Cbor): Cbor[] | undefined {
  if (cbor.type === MajorType.Array) {
    return cbor.value;
  }
  return undefined;
}
