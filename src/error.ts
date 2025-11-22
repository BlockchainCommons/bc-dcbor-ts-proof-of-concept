/**
 * Error types for CBOR encoding and decoding.
 *
 * @module error
 */

import type { Tag } from './tag';
import { tagToString } from './tag';

/**
 * A comprehensive set of errors that can occur during CBOR encoding and
 * decoding operations with special focus on enforcing the deterministic
 * encoding rules specified in the dCBOR specification.
 *
 * The dCBOR implementation validates all encoded CBOR against the
 * deterministic encoding requirements of RFC 8949 §4.2.1, plus additional
 * constraints defined in the dCBOR application profile. These errors represent
 * all the possible validation failures and decoding issues that can arise.
 */
export type Error =
  /**
   * The CBOR data ended prematurely during decoding, before a complete CBOR
   * item could be decoded. This typically happens when a CBOR item's
   * structure indicates more data than is actually present.
   */
  | { type: 'Underrun' }
  /**
   * An unsupported or invalid value was encountered in a CBOR header byte.
   * The parameter contains the unsupported header byte value.
   * This can occur when decoding CBOR that uses unsupported features or is
   * malformed.
   */
  | { type: 'UnsupportedHeaderValue'; value: number }
  /**
   * A CBOR numeric value was encoded in a non-canonical form, violating the
   * deterministic encoding requirement of dCBOR (per Section 2.3 of the
   * dCBOR specification).
   *
   * This error is triggered when:
   * - An integer is not encoded in its shortest possible form
   * - A floating point value that could be represented as an integer was not
   *   reduced
   * - A NaN value was not encoded in its canonical form (`f97e00`)
   */
  | { type: 'NonCanonicalNumeric' }
  /**
   * An invalid CBOR simple value was encountered during decoding.
   *
   * Per Section 2.4 of the dCBOR specification, only `false`, `true`,
   * `null`, and floating point values are valid simple values in dCBOR.
   * All other major type 7 values are invalid.
   */
  | { type: 'InvalidSimpleValue' }
  /**
   * A CBOR text string was not valid UTF-8. The parameter contains the
   * specific error message.
   *
   * All CBOR text strings (major type 3) must be valid UTF-8 per RFC 8949.
   */
  | { type: 'InvalidString'; message: string }
  /**
   * A CBOR text string was not encoded in Unicode Canonical Normalization
   * Form C (NFC).
   *
   * Per Section 2.5 of the dCBOR specification, all text strings must be in
   * NFC form, and decoders must reject any encoded text strings that are
   * not in NFC.
   */
  | { type: 'NonCanonicalString' }
  /**
   * The decoded CBOR item didn't consume all input data.
   * The parameter contains the number of unused bytes.
   *
   * This error occurs when decoding functions expect exactly one CBOR item
   * but the input contains additional data after a valid CBOR item.
   */
  | { type: 'UnusedData'; count: number }
  /**
   * The keys in a decoded CBOR map were not in the canonical lexicographic order
   * of their encoding.
   *
   * Per the CDE specification and Section 2.1 of dCBOR, map keys must be in
   * ascending lexicographic order of their encoded representation for
   * deterministic encoding.
   */
  | { type: 'MisorderedMapKey' }
  /**
   * A decoded CBOR map contains duplicate keys, which is invalid.
   *
   * Per Section 2.2 of the dCBOR specification, CBOR maps must not contain
   * duplicate keys, and decoders must reject encoded maps with duplicate
   * keys.
   */
  | { type: 'DuplicateMapKey' }
  /**
   * A requested key was not found in a CBOR map during data extraction.
   */
  | { type: 'MissingMapKey' }
  /**
   * A CBOR numeric value could not be represented in the specified target
   * numeric type.
   *
   * This occurs when attempting to convert a CBOR number to a numeric
   * type that is too small to represent the value without loss of
   * precision.
   */
  | { type: 'OutOfRange' }
  /**
   * The CBOR value is not of the expected type for a conversion or
   * operation.
   *
   * This occurs when attempting to convert a CBOR value to a type that
   * doesn't match the actual CBOR item's type (e.g., trying to convert a
   * string to an integer).
   */
  | { type: 'WrongType' }
  /**
   * The CBOR tagged value had a different tag than expected.
   * Contains the expected tag and the actual tag found.
   */
  | { type: 'WrongTag'; expected: Tag; actual: Tag }
  /**
   * Invalid UTF‑8 in a text string.
   */
  | { type: 'InvalidUtf8'; message: string }
  /**
   * Invalid ISO 8601 date format.
   */
  | { type: 'InvalidDate'; message: string }
  /**
   * Custom error message.
   */
  | { type: 'Custom'; message: string };

/**
 * Create a custom error with a message.
 *
 * Matches Rust's `Error::msg()` method.
 */
export function errorMsg(message: string): Error {
  return { type: 'Custom', message };
}

/**
 * Convert an Error to a display string.
 *
 * Matches Rust's `Display` trait / `to_string()` method.
 */
export function errorToString(error: Error): string {
  switch (error.type) {
    case 'Underrun':
      return 'early end of CBOR data';
    case 'UnsupportedHeaderValue':
      return 'unsupported value in CBOR header';
    case 'NonCanonicalNumeric':
      return 'a CBOR numeric value was encoded in non-canonical form';
    case 'InvalidSimpleValue':
      return 'an invalid CBOR simple value was encountered';
    case 'InvalidString':
      return `an invalidly-encoded UTF-8 string was encountered in the CBOR (${error.message})`;
    case 'NonCanonicalString':
      return 'a CBOR string was not encoded in Unicode Canonical Normalization Form C';
    case 'UnusedData':
      return `the decoded CBOR had ${error.count} extra bytes at the end`;
    case 'MisorderedMapKey':
      return 'the decoded CBOR map has keys that are not in canonical order';
    case 'DuplicateMapKey':
      return 'the decoded CBOR map has a duplicate key';
    case 'MissingMapKey':
      return 'missing CBOR map key';
    case 'OutOfRange':
      return 'the CBOR numeric value could not be represented in the specified numeric type';
    case 'WrongType':
      return 'the decoded CBOR value was not the expected type';
    case 'WrongTag':
      return `expected CBOR tag ${tagToString(error.expected)}, but got ${tagToString(error.actual)}`;
    case 'InvalidUtf8':
      return `invalid UTF‑8 string: ${error.message}`;
    case 'InvalidDate':
      return `invalid ISO 8601 date string: ${error.message}`;
    case 'Custom':
      return error.message;
  }
}

/**
 * Result type matching Rust's `Result<T, Error>`.
 *
 * In TypeScript, we use a discriminated union for Result instead of
 * try/catch for better type safety and Rust compatibility.
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/**
 * Create a successful Result.
 */
export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Create a failed Result.
 */
export function Err<T>(error: Error): Result<T> {
  return { ok: false, error };
}

/**
 * Helper to throw an Error as a JavaScript Error object.
 *
 * This is used when we need to throw for backwards compatibility
 * with existing code that uses try/catch.
 */
export function throwError(error: Error): never {
  throw new Error(errorToString(error));
}
