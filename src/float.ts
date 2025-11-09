/**
 * Float encoding and conversion utilities for dCBOR.
 *
 * This file exists for 1:1 correspondence with Rust's float.rs.
 *
 * # Floating Point Number Support in dCBOR
 *
 * dCBOR provides canonical encoding for floating point values.
 *
 * Per the dCBOR specification, the canonical encoding rules ensure
 * deterministic representation:
 *
 * - Numeric reduction: Floating point values with zero fractional part in
 *   range [-2^63, 2^64-1] are automatically encoded as integers (e.g., 42.0
 *   becomes 42)
 * - Values are encoded in the smallest possible representation that preserves
 *   their value
 * - All NaN values are canonicalized to a single representation: 0xf97e00
 * - Positive/negative infinity are canonicalized to half-precision
 *   representations
 *
 * @module float
 */

import * as byteData from "byte-data";
import { encodeVarInt } from './varint';
import { MajorType } from './cbor';
import { ExactU64, ExactU32, ExactU16, ExactI128, ExactF64, ExactF32, ExactF16 } from './exact';

/**
 * Canonical NaN representation in CBOR: 0xf97e00
 */
export const CBOR_NAN = new Uint8Array([0xf9, 0x7e, 0x00]);

/**
 * Check if a number has a fractional part.
 */
export function hasFractionalPart(n: number): boolean {
  return n !== Math.floor(n);
}

/**
 * Convert number to 64-bit float binary (big-endian).
 */
export function numberToBinary64(n: number): Uint8Array {
  const data = new Uint8Array(8);
  byteData.packTo(n, { bits: 64, fp: true, be: true }, data);
  return data;
}

/**
 * Convert 64-bit binary to number.
 */
export function binary64ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 64, fp: true, be: true });
}

/**
 * Convert number to 32-bit float binary (big-endian).
 */
export function numberToBinary32(n: number): Uint8Array {
  const data = new Uint8Array(4);
  byteData.packTo(n, { bits: 32, fp: true, be: true }, data);
  return data;
}

/**
 * Convert 32-bit binary to number.
 */
export function binary32ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 32, fp: true, be: true });
}

/**
 * Convert number to 16-bit float binary (big-endian).
 */
export function numberToBinary16(n: number): Uint8Array {
  const data = new Uint8Array(2);
  byteData.packTo(n, { bits: 16, fp: true, be: true }, data);
  return data;
}

/**
 * Convert 16-bit binary to number.
 */
export function binary16ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 16, fp: true, be: true });
}

/**
 * Encode f64 value to CBOR data bytes.
 * Implements numeric reduction and canonical encoding rules.
 * Matches Rust's f64_cbor_data function.
 */
export function f64CborData(value: number): Uint8Array {
  const n = value;

  // Try to reduce to f32 first
  const f32Bytes = numberToBinary32(n);
  const f = binary32ToNumber(f32Bytes);
  if (f === n) {
    return f32CborData(f);
  }

  // Try numeric reduction to negative integer
  if (n < 0.0) {
    const i128 = ExactI128.exactFromF64(n);
    if (i128 !== undefined) {
      const i = ExactU64.exactFromI128(-1n - i128);
      if (i !== undefined) {
        // Encode as negative integer
        const num = typeof i === 'bigint' ? Number(i) : i;
        return encodeVarInt(num, MajorType.Negative);
      }
    }
  }

  // Try numeric reduction to unsigned integer
  const u = ExactU64.exactFromF64(n);
  if (u !== undefined) {
    const num = typeof u === 'bigint' ? Number(u) : u;
    return encodeVarInt(num, MajorType.Unsigned);
  }

  // Canonical NaN
  if (Number.isNaN(value)) {
    return CBOR_NAN;
  }

  // Encode as f64 - use encode_int style (always 8 bytes with 0x1b prefix)
  const bytes = numberToBinary64(n);
  const majorByte = 0xfb; // 0x1b | (MajorType.Simple << 5) = 0x1b | 0xe0 = 0xfb
  return new Uint8Array([majorByte, ...bytes]);
}

/**
 * Validate canonical encoding for f64.
 * Matches Rust's validate_canonical_f64 function.
 */
export function validateCanonicalF64(n: number): void {
  const f32Bytes = numberToBinary32(n);
  const f32 = binary32ToNumber(f32Bytes);

  if (n === f32 || n === Math.trunc(n) || Number.isNaN(n)) {
    throw new Error('NonCanonicalNumeric: f64 should be reduced');
  }
}

/**
 * Encode f32 value to CBOR data bytes.
 * Implements numeric reduction and canonical encoding rules.
 * Matches Rust's f32_cbor_data function.
 */
export function f32CborData(value: number): Uint8Array {
  const n = value;

  // Try to reduce to f16
  const f16Bytes = numberToBinary16(n);
  const f = binary16ToNumber(f16Bytes);
  if (f === n) {
    return f16CborData(f);
  }

  // Try numeric reduction to negative integer
  if (n < 0.0) {
    const u = ExactU64.exactFromF32(-1.0 - n);
    if (u !== undefined) {
      const num = typeof u === 'bigint' ? Number(u) : u;
      return encodeVarInt(num, MajorType.Negative);
    }
  }

  // Try numeric reduction to unsigned integer
  const u = ExactU32.exactFromF32(n);
  if (u !== undefined) {
    return encodeVarInt(u, MajorType.Unsigned);
  }

  // Canonical NaN
  if (Number.isNaN(value)) {
    return CBOR_NAN;
  }

  // Encode as f32
  const bits = new DataView(numberToBinary32(n).buffer).getUint32(0, false);
  return encodeVarInt(bits, MajorType.Simple);
}

/**
 * Validate canonical encoding for f32.
 * Matches Rust's validate_canonical_f32 function.
 */
export function validateCanonicalF32(n: number): void {
  const f16Bytes = numberToBinary16(n);
  const f16 = binary16ToNumber(f16Bytes);

  if (n === f16 || n === Math.trunc(n) || Number.isNaN(n)) {
    throw new Error('NonCanonicalNumeric: f32 should be reduced');
  }
}

/**
 * Encode f16 value to CBOR data bytes.
 * Implements numeric reduction and canonical encoding rules.
 * Matches Rust's f16_cbor_data function.
 */
export function f16CborData(value: number): Uint8Array {
  const n = value;

  // Try numeric reduction to negative integer
  if (n < 0.0) {
    const u = ExactU64.exactFromF64(-1.0 - n);
    if (u !== undefined) {
      const num = typeof u === 'bigint' ? Number(u) : u;
      return encodeVarInt(num, MajorType.Negative);
    }
  }

  // Try numeric reduction to unsigned integer
  const u = ExactU16.exactFromF64(n);
  if (u !== undefined) {
    return encodeVarInt(u, MajorType.Unsigned);
  }

  // Canonical NaN
  if (Number.isNaN(value)) {
    return CBOR_NAN;
  }

  // Encode as f16
  const bits = new DataView(numberToBinary16(value).buffer).getUint16(0, false);
  return encodeVarInt(bits, MajorType.Simple);
}

/**
 * Validate canonical encoding for f16.
 * Matches Rust's validate_canonical_f16 function.
 */
export function validateCanonicalF16(value: number): void {
  const n = value;
  const f = n;

  const f16Bytes = numberToBinary16(value);
  const bits = new DataView(f16Bytes.buffer).getUint16(0, false);

  if (f === Math.trunc(f) || (Number.isNaN(value) && bits !== 0x7e00)) {
    throw new Error('NonCanonicalNumeric: f16 not canonical');
  }
}

/**
 * Convert smallest possible float binary representation to number.
 * This is the canonical decoder - validates that larger representations
 * are not reducible to smaller ones.
 */
export function numberToBinary(n: number): Uint8Array {
  if (Number.isNaN(n)) {
    return new Uint8Array([0x7e, 0x00]);
  }

  const n32 = numberToBinary32(n);
  const f32 = binary32ToNumber(n32);
  if (f32 === n) {
    const n16 = numberToBinary16(n);
    const f16 = binary16ToNumber(n16);
    if (f16 === n) {
      return n16;
    }
    return n32;
  }
  return numberToBinary64(n);
}

/**
 * Convert binary float data to number with canonical validation.
 * Throws error if the float uses a larger representation than necessary.
 */
export function binaryToNumber(data: Uint8Array): number {
  if (data.length === 2) {
    return binary16ToNumber(data);
  }

  if (data.length === 4) {
    const f32 = binary32ToNumber(data);
    const n16 = numberToBinary16(f32);
    const f16 = binary16ToNumber(n16);
    if (f16 === f32) {
      throw new Error('NonCanonical: 32-bit float should be 16-bit');
    }
    return f32;
  }

  if (data.length === 8) {
    const f64 = binary64ToNumber(data);
    const n32 = numberToBinary32(f64);
    const f32 = binary32ToNumber(n32);
    if (f32 === f64) {
      throw new Error('NonCanonical: 64-bit float should be 32-bit');
    }
    return f64;
  }

  throw new Error('Invalid float length');
}
