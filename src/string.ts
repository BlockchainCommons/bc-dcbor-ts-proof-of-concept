/**
 * String utilities for dCBOR.
 *
 * In TypeScript, string encoding/decoding is handled in encode.ts and decode.ts.
 *
 * @module string
 */

import { type Cbor, MajorType } from './cbor';

/**
 * Check if a CBOR value is a text string.
 */
export function isString(cbor: Cbor): cbor is { isCbor: true; type: MajorType.Text; value: string } {
  return cbor.type === MajorType.Text;
}

/**
 * Extract string value from CBOR text.
 * Throws if the value is not a text string.
 */
export function asString(cbor: Cbor): string {
  if (!isString(cbor)) {
    throw new Error('CBOR value is not a text string');
  }
  return cbor.value;
}
