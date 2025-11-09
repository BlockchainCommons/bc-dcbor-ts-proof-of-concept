import { CborMap } from "./map";
import type { Simple } from "./simple";
export type { Simple };

export enum MajorType {
  Unsigned = 0,
  Negative = 1,
  ByteString = 2,
  Text = 3,
  Array = 4,
  Map = 5,
  Tagged = 6,
  Simple = 7,
}

export type CborNumber = number | bigint;

export function isCborNumber(value: any): value is CborNumber {
  return typeof value === 'number' || typeof value === 'bigint';
}

export function isCbor(value: any): boolean {
  return value && typeof value === 'object' && 'isCbor' in value && value.isCbor === true;
}

export type CborUnsignedType = { isCbor: true, type: MajorType.Unsigned, value: CborNumber };
export type CborNegativeType = { isCbor: true, type: MajorType.Negative, value: CborNumber };
export type CborByteStringType = { isCbor: true, type: MajorType.ByteString, value: Uint8Array };
export type CborTextType = { isCbor: true, type: MajorType.Text, value: string };
export type CborArrayType = { isCbor: true, type: MajorType.Array, value: Cbor[] };
export type CborMapType = { isCbor: true, type: MajorType.Map, value: CborMap };
export type CborTaggedType = { isCbor: true, type: MajorType.Tagged, tag: CborNumber, value: Cbor };
export type CborSimpleType = { isCbor: true, type: MajorType.Simple, value: Simple };

export type Cbor = CborUnsignedType |
  CborNegativeType | CborByteStringType | CborTextType |
  CborArrayType | CborMapType | CborTaggedType |
  CborSimpleType;

/**
 * CBOR constants and helper methods.
 *
 * Provides constants for common simple values (False, True, Null) and static methods
 * matching the Rust CBOR API for encoding/decoding.
 */
export const Cbor = {
  // Static CBOR simple values (matching Rust naming)
  False: { isCbor: true as const, type: MajorType.Simple as const, value: { type: 'False' as const } },
  True: { isCbor: true as const, type: MajorType.Simple as const, value: { type: 'True' as const } },
  Null: { isCbor: true as const, type: MajorType.Simple as const, value: { type: 'Null' as const } },

  // ============================================================================
  // Convenience Methods (matches Rust CBOR convenience constructors)
  // ============================================================================

  /**
   * Creates a CBOR value from any JavaScript value.
   *
   * Matches Rust's `CBOR::from()` behavior for various types.
   *
   * @param value - Any JavaScript value (number, string, boolean, null, array, object, etc.)
   * @returns A CBOR symbolic representation
   */
  from(value: any): Cbor {
    const { cbor } = require('./encode');
    return cbor(value);
  },

  // ============================================================================
  // Decoding Methods (matches Rust CBOR::try_from_*)
  // ============================================================================

  /**
   * Decodes binary data into CBOR symbolic representation.
   *
   * Matches Rust's `CBOR::try_from_data()` method.
   *
   * @param data - The binary data to decode
   * @returns A CBOR value if decoding was successful
   * @throws Error if the data is not valid CBOR or violates dCBOR encoding rules
   */
  tryFromData(data: Uint8Array): Cbor {
    const { decodeCbor } = require('./decode');
    return decodeCbor(data);
  },

  /**
   * Decodes a hexadecimal string into CBOR symbolic representation.
   *
   * Matches Rust's `CBOR::try_from_hex()` method.
   *
   * @param hex - A string containing hexadecimal characters
   * @returns A CBOR value if decoding was successful
   * @throws Error if the hex string is invalid or the resulting data is not valid dCBOR
   */
  tryFromHex(hex: string): Cbor {
    const { hexToBytes } = require('./data-utils');
    const data = hexToBytes(hex);
    return this.tryFromData(data);
  },

  // ============================================================================
  // Encoding Methods (matches Rust CBOR::to_cbor_data)
  // ============================================================================

  /**
   * Encodes a CBOR value to binary data following dCBOR encoding rules.
   *
   * Matches Rust's `CBOR::to_cbor_data()` method.
   *
   * @param cbor - The CBOR value to encode
   * @returns A Uint8Array containing the encoded CBOR data
   */
  toCborData(cbor: Cbor): Uint8Array {
    const { cborData } = require('./encode');
    return cborData(cbor);
  },

  /**
   * Encodes a CBOR value to a hexadecimal string.
   *
   * @param cbor - The CBOR value to encode
   * @returns A hexadecimal string representation
   */
  toHex(cbor: Cbor): string {
    const { bytesToHex } = require('./data-utils');
    return bytesToHex(this.toCborData(cbor));
  },

  // ============================================================================
  // Display/Debug Formatting (matches Rust Display and Debug traits)
  // ============================================================================

  /**
   * Formats a CBOR value as diagnostic notation (flat, single-line).
   *
   * Matches Rust's `Display` trait (to_string(), format!("{}")).
   *
   * @param cbor - The CBOR value to format
   * @returns A string in CBOR diagnostic notation
   */
  toString(cbor: Cbor): string {
    const { cborDiagnostic } = require('./diag');
    return cborDiagnostic(cbor, { flat: true });
  },

  /**
   * Formats a CBOR value with detailed type annotations.
   *
   * Matches Rust's `Debug` trait (format!("{:?}")).
   *
   * @param cbor - The CBOR value to format
   * @returns A string with type annotations
   */
  toDebugString(cbor: Cbor): string {
    const { cborDebug } = require('./debug');
    return cborDebug(cbor);
  },

  /**
   * Formats a CBOR value as pretty-printed (multi-line) diagnostic notation.
   *
   * @param cbor - The CBOR value to format
   * @returns A multi-line string in CBOR diagnostic notation
   */
  toDiagnostic(cbor: Cbor): string {
    const { cborDiagnostic } = require('./diag');
    return cborDiagnostic(cbor, { flat: false });
  },

  // ============================================================================
  // Hash Implementation (matches Rust Hash trait)
  // ============================================================================

  /**
   * Computes a hash value for a CBOR value.
   *
   * Matches Rust's `Hash` trait implementation. The hash is deterministic
   * and based on the CBOR's type (discriminant) and value.
   *
   * This can be useful for:
   * - Using CBOR values as Map/Set keys
   * - Equality comparisons
   * - Caching/memoization
   *
   * Note: This uses a simple 32-bit FNV-1a hash algorithm for JavaScript compatibility.
   *
   * @param cbor - The CBOR value to hash
   * @returns A 32-bit hash value as a number
   */
  hash(cbor: Cbor): number {
    const { cborHash } = require('./hash');
    return cborHash(cbor);
  },
};
