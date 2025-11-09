/**
 * Hash implementation for CBOR values.
 *
 * Provides deterministic hashing that matches Rust's Hash trait behavior.
 * Uses FNV-1a (Fowler-Noll-Vo) hash algorithm for simplicity and speed.
 *
 * @module hash
 */

import { Cbor, MajorType } from './cbor';
import { isFloat } from './simple';

// FNV-1a hash constants for 32-bit
const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

/**
 * FNV-1a hash function for 32-bit hashes.
 *
 * This is a simple, fast, non-cryptographic hash function suitable
 * for hash tables and general purpose hashing.
 */
class Hasher {
  private hash: number = FNV_OFFSET_BASIS;

  /**
   * Adds a single byte to the hash.
   */
  writeByte(byte: number): void {
    this.hash ^= byte & 0xff;
    this.hash = Math.imul(this.hash, FNV_PRIME);
  }

  /**
   * Adds a number to the hash (as 8 bytes, little-endian).
   */
  writeNumber(n: number): void {
    // For integers within safe range
    if (Number.isInteger(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER) {
      // Write as 64-bit integer (little-endian)
      const view = new DataView(new ArrayBuffer(8));
      view.setFloat64(0, n, true); // true = little-endian
      for (let i = 0; i < 8; i++) {
        this.writeByte(view.getUint8(i));
      }
    } else {
      // For floats or large numbers, use float64 representation
      const view = new DataView(new ArrayBuffer(8));
      view.setFloat64(0, n, true);
      for (let i = 0; i < 8; i++) {
        this.writeByte(view.getUint8(i));
      }
    }
  }

  /**
   * Adds a BigInt to the hash.
   */
  writeBigInt(n: bigint): void {
    // Convert to bytes (little-endian)
    let value = n < 0n ? -n : n;
    const isNegative = n < 0n;

    // Hash sign bit
    this.writeByte(isNegative ? 1 : 0);

    // Hash magnitude bytes
    if (value === 0n) {
      this.writeByte(0);
    } else {
      while (value > 0n) {
        this.writeByte(Number(value & 0xffn));
        value >>= 8n;
      }
    }
  }

  /**
   * Adds a byte array to the hash.
   */
  writeBytes(bytes: Uint8Array): void {
    for (let i = 0; i < bytes.length; i++) {
      this.writeByte(bytes[i]);
    }
  }

  /**
   * Adds a string to the hash (UTF-8 encoded).
   */
  writeString(str: string): void {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.writeBytes(bytes);
  }

  /**
   * Gets the final hash value.
   */
  finish(): number {
    // Return as unsigned 32-bit integer
    return this.hash >>> 0;
  }
}

/**
 * Computes a hash value for a CBOR value.
 *
 * This implementation matches the structure of Rust's Hash trait:
 * - Hashes the discriminant (major type) first
 * - Then hashes the value content
 *
 * @param cbor - The CBOR value to hash
 * @returns A 32-bit hash value
 */
export function cborHash(cbor: Cbor): number {
  const hasher = new Hasher();

  // Hash the major type (discriminant) first, just like Rust
  hasher.writeByte(cbor.type);

  // Hash the value based on type
  switch (cbor.type) {
    case MajorType.Unsigned:
      if (typeof cbor.value === 'bigint') {
        hasher.writeBigInt(cbor.value);
      } else {
        hasher.writeNumber(cbor.value);
      }
      break;

    case MajorType.Negative:
      if (typeof cbor.value === 'bigint') {
        hasher.writeBigInt(cbor.value);
      } else {
        hasher.writeNumber(cbor.value);
      }
      break;

    case MajorType.ByteString:
      hasher.writeBytes(cbor.value);
      break;

    case MajorType.Text:
      hasher.writeString(cbor.value);
      break;

    case MajorType.Array:
      // Hash array length first, then each element
      hasher.writeNumber(cbor.value.length);
      for (const item of cbor.value) {
        const itemHash = cborHash(item);
        hasher.writeNumber(itemHash);
      }
      break;

    case MajorType.Map:
      // Hash map size first, then each entry
      hasher.writeNumber(cbor.value.entries.length);
      for (const { key, value } of cbor.value.entries) {
        const keyHash = cborHash(key);
        const valueHash = cborHash(value);
        hasher.writeNumber(keyHash);
        hasher.writeNumber(valueHash);
      }
      break;

    case MajorType.Tagged:
      // Hash tag first, then tagged value
      if (typeof cbor.tag === 'bigint') {
        hasher.writeBigInt(cbor.tag);
      } else {
        hasher.writeNumber(cbor.tag);
      }
      const taggedHash = cborHash(cbor.value);
      hasher.writeNumber(taggedHash);
      break;

    case MajorType.Simple:
      // Hash discriminant first
      switch (cbor.value.type) {
        case 'False':
          hasher.writeByte(20);
          break;
        case 'True':
          hasher.writeByte(21);
          break;
        case 'Null':
          hasher.writeByte(22);
          break;
        case 'Float':
          hasher.writeNumber(cbor.value.value);
          break;
      }
      break;
  }

  return hasher.finish();
}
