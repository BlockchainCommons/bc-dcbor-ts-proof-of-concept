/**
 * Boolean value utilities for dCBOR.
 *
 * dCBOR supports boolean values through major type 7 (simple values),
 * where `false` is encoded as 0xf4 and `true` as 0xf5.
 *
 * @module bool-value
 */

import { type Cbor, MajorType } from './cbor';

/**
 * Check if a CBOR value is a boolean.
 */
export function isBoolean(cbor: Cbor): boolean {
  return cbor.type === MajorType.Simple &&
    (cbor.value.type === 'False' || cbor.value.type === 'True');
}

/**
 * Extract boolean value from CBOR.
 * Throws if the value is not a boolean.
 */
export function asBoolean(cbor: Cbor): boolean {
  if (cbor.type === MajorType.Simple && cbor.value.type === 'False') return false;
  if (cbor.type === MajorType.Simple && cbor.value.type === 'True') return true;
  throw new Error('CBOR value is not a boolean');
}
