/**
 * Byte string utilities for dCBOR.
 *
 * In TypeScript, byte string conversion is handled directly in encode.ts.
 * This file exists for 1:1 correspondence with Rust's byte_string.rs.
 *
 * @module byte-string
 */

import { Cbor, MajorType } from './cbor';

/**
 * Check if a CBOR value is a byte string.
 */
export function isByteString(cbor: Cbor): cbor is { isCbor: true; type: MajorType.ByteString; value: Uint8Array } {
  return cbor.type === MajorType.ByteString;
}

/**
 * Extract Uint8Array from CBOR byte string.
 * Throws if the value is not a byte string.
 */
export function asByteString(cbor: Cbor): Uint8Array {
  if (!isByteString(cbor)) {
    throw new Error('CBOR value is not a byte string');
  }
  return cbor.value;
}
