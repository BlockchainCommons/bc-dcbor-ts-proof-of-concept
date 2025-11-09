import { CborMap } from "./map";
import type { Simple } from "./simple";
import { simpleCborData, isFloat as isSimpleFloat, isNaN as isSimpleNaN } from "./simple";
import { hasFractionalPart } from "./float";
import { encodeVarInt } from "./varint";
import { concatBytes } from "./stdlib";
import { bytesToHex } from "./dump";
import { hexToBytes } from "./dump";
import { Tag } from "./tag";

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

/**
 * Type for values that can be converted to CBOR.
 * Matches Rust's From<T> trait implementations for CBOR.
 */
export type CborEncodable =
  | Cbor
  | CborNumber
  | string
  | boolean
  | null
  | undefined
  | Uint8Array
  | CborMap
  | CborEncodable[]
  | Map<unknown, unknown>
  | Set<unknown>
  | { [key: string]: unknown };

export function isCborNumber(value: unknown): value is CborNumber {
  return typeof value === 'number' || typeof value === 'bigint';
}

export function isCbor(value: unknown): value is Cbor {
  return value !== null && typeof value === 'object' && 'isCbor' in value && value.isCbor === true;
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
// eslint-disable-next-line no-redeclare
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
  from(value: CborEncodable): Cbor {
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
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
    return cborData(cbor);
  },

  /**
   * Encodes a CBOR value to a hexadecimal string.
   *
   * @param cbor - The CBOR value to encode
   * @returns A hexadecimal string representation
   */
  toHex(cbor: Cbor): string {
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    const { cborDiagnostic } = require('./diag');
    return cborDiagnostic(cbor, { flat: false });
  },

  // ============================================================================
  // Hash Implementation (matches Rust Hash trait)
  // ============================================================================

};

// ============================================================================
// Encoding Functions (matches Rust CBOR conversion logic)
// ============================================================================

export interface ToCbor {
  toCbor(): Cbor;
}

/**
 * Convert any value to a CBOR representation.
 * Matches Rust's `From` trait implementations for CBOR.
 */
export function cbor(value: CborEncodable): Cbor {
  if (isCbor(value)) {
    return value;
  }

  if (isCborNumber(value)) {
    if (typeof value === 'number' && isNaN(value)) {
      return { isCbor: true, type: MajorType.Simple, value: { type: 'Float', value: NaN } };
    } else if (typeof value === 'number' && hasFractionalPart(value)) {
      return { isCbor: true, type: MajorType.Simple, value: { type: 'Float', value: value } };
    } else if (value == Infinity) {
      return { isCbor: true, type: MajorType.Simple, value: { type: 'Float', value: Infinity } };
    } else if (value == -Infinity) {
      return { isCbor: true, type: MajorType.Simple, value: { type: 'Float', value: -Infinity } };
    } else if (value < 0) {
      // Store the magnitude to encode, matching Rust's representation
      // For a negative value n, CBOR encodes it as -1-n, so we store -n-1
      if (typeof value === 'bigint') {
        return { isCbor: true, type: MajorType.Negative, value: -value - 1n };
      } else {
        return { isCbor: true, type: MajorType.Negative, value: -value - 1 };
      }
    } else {
      return { isCbor: true, type: MajorType.Unsigned, value: value };
    }
  } else if (typeof value === 'string') {
    // dCBOR requires all text strings to be in Unicode Normalization Form C (NFC)
    // This ensures deterministic encoding regardless of how the string was composed
    const normalized = value.normalize('NFC');
    return { isCbor: true, type: MajorType.Text, value: normalized };
  } else if (value === null) {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'Null' } };
  } else if (value === true) {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'True' } };
  } else if (value === false) {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'False' } };
  } else if (Array.isArray(value)) {
    return { isCbor: true, type: MajorType.Array, value: value.map(cbor) };
  } else if (value instanceof Uint8Array) {
    return { isCbor: true, type: MajorType.ByteString, value: value };
  } else if (value instanceof CborMap) {
    return { isCbor: true, type: MajorType.Map, value: value };
  } else if (value instanceof Map) {
    return { isCbor: true, type: MajorType.Map, value: new CborMap(value) };
  } else if (value instanceof Set) {
    return { isCbor: true, type: MajorType.Array, value: Array.from(value).map(v => cbor(v as CborEncodable)) };
  } else if (typeof value === 'object' && value !== null && 'taggedCbor' in value && typeof value.taggedCbor === 'function') {
    return value.taggedCbor();
  } else if (typeof value === 'object' && value !== null && 'toCbor' in value && typeof value.toCbor === 'function') {
    return value.toCbor();
  } else if (typeof value === 'object' && value !== null && 'tag' in value && 'value' in value) {
    // Handle plain tagged value format: { tag: number, value: unknown }
    const keys = Object.keys(value);
    const objValue = value as { tag: unknown; value: unknown; [key: string]: unknown };
    if (keys.length === 2 && keys.includes('tag') && keys.includes('value')) {
      return taggedCbor(objValue.tag, objValue.value as CborEncodable);
    }
    // Not a tagged value, fall through to map handling
    const map = new CborMap();
    for (const [key, val] of Object.entries(value)) {
      map.set(cbor(key as CborEncodable), cbor(val as CborEncodable));
    }
    return { isCbor: true, type: MajorType.Map, value: map };
  } else if (typeof value === 'object' && value !== null) {
    // Handle plain objects by converting to CborMap
    const map = new CborMap();
    for (const [key, val] of Object.entries(value)) {
      map.set(cbor(key as CborEncodable), cbor(val as CborEncodable));
    }
    return { isCbor: true, type: MajorType.Map, value: map };
  }

  throw new Error("Not supported");
}

export function cborHex(value: CborEncodable): string {
  return bytesToHex(cborData(value));
}

/**
 * Encode a CBOR value to binary data.
 * Matches Rust's `CBOR::to_cbor_data()` method.
 */
export function cborData(value: CborEncodable): Uint8Array {
  const c = cbor(value);
  switch (c.type) {
    case MajorType.Unsigned: {
      return encodeVarInt(c.value, MajorType.Unsigned);
    }
    case MajorType.Negative: {
      // Value is already stored as the magnitude to encode (matching Rust)
      return encodeVarInt(c.value, MajorType.Negative);
    }
    case MajorType.ByteString: {
      if (c.value instanceof Uint8Array) {
        const lengthBytes = encodeVarInt(c.value.length, MajorType.ByteString);
        return new Uint8Array([...lengthBytes, ...c.value]);
      }
      break;
    }
    case MajorType.Text: {
      if (typeof c.value === 'string') {
        const utf8Bytes = new TextEncoder().encode(c.value);
        const lengthBytes = encodeVarInt(utf8Bytes.length, MajorType.Text);
        return new Uint8Array([...lengthBytes, ...utf8Bytes]);
      }
      break;
    }
    case MajorType.Tagged: {
      const tagged = c as CborTaggedType;
      if (typeof tagged.tag === 'bigint' || typeof tagged.tag === 'number') {
        const tagBytes = encodeVarInt(tagged.tag, MajorType.Tagged);
        const valueBytes = cborData(tagged.value);
        return new Uint8Array([...tagBytes, ...valueBytes]);
      }
      break;
    }
    case MajorType.Simple: {
      // Use the simpleCborData function from simple.ts
      return simpleCborData(c.value);
    }
    case MajorType.Array: {
      const array = c as CborArrayType;
      const arrayBytes = array.value.map(cborData);
      const flatArrayBytes = concatBytes(arrayBytes);
      const lengthBytes = encodeVarInt(array.value.length, MajorType.Array);
      return new Uint8Array([...lengthBytes, ...flatArrayBytes]);
    }
    case MajorType.Map: {
      const map = c as CborMapType;
      const entries = map.value.entries;
      const arrayBytes = entries.map(({key, value}) => concatBytes([cborData(key), cborData(value)]));
      const flatArrayBytes = concatBytes(arrayBytes);
      const lengthBytes = encodeVarInt(entries.length, MajorType.Map);
      return new Uint8Array([...lengthBytes, ...flatArrayBytes]);
    }
  }
  throw new Error("Invalid CBOR");
}

export function encodeCbor(value: CborEncodable): Uint8Array {
  return cborData(cbor(value));
}

export function taggedCbor(tag: CborNumber | unknown, value: CborEncodable): Cbor {
  // Validate and convert tag to CborNumber
  const tagNumber: CborNumber = typeof tag === 'number' || typeof tag === 'bigint' ? tag : Number(tag);
  return {
    isCbor: true,
    type: MajorType.Tagged,
    tag: tagNumber,
    value: cbor(value),
  };
}

// ============================================================================
// Convenience Methods
// (1:1 correspondence with Rust's conveniences.rs impl blocks)
// ============================================================================

/**
 * Convenience methods for CBOR values.
 * These provide utilities for creating, checking, and extracting CBOR types.
 * Corresponds to Rust's conveniences.rs impl blocks.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CborConvenience {
  // Byte String conveniences

  export function toByteString(data: Uint8Array): Cbor {
    return { isCbor: true, type: MajorType.ByteString, value: data };
  }

  export function toByteStringFromHex(hex: string): Cbor {
    return toByteString(hexToBytes(hex));
  }

  export function tryIntoByteString(c: Cbor): Uint8Array {
    if (c.type !== MajorType.ByteString) {
      throw new Error('Wrong type');
    }
    return c.value;
  }

  export function isByteString(c: Cbor): boolean {
    return c.type === MajorType.ByteString;
  }

  export function intoByteString(c: Cbor): Uint8Array | undefined {
    try {
      return tryIntoByteString(c);
    } catch {
      return undefined;
    }
  }

  export function tryByteString(c: Cbor): Uint8Array {
    return tryIntoByteString(c);
  }

  export function asByteString(c: Cbor): Uint8Array | undefined {
    return c.type === MajorType.ByteString ? c.value : undefined;
  }

  // Tagged Value conveniences

  export function toTaggedValue(tag: CborNumber | Tag, item: CborEncodable): Cbor {
    const tagValue = typeof tag === 'object' && 'value' in tag ? tag.value : tag;
    return {
      isCbor: true,
      type: MajorType.Tagged,
      tag: tagValue,
      value: cbor(item)
    };
  }

  export function tryIntoTaggedValue(c: Cbor): [Tag, Cbor] {
    if (c.type !== MajorType.Tagged) {
      throw new Error('Wrong type');
    }
    const tag: Tag = { value: c.tag, name: `tag-${c.tag}` };
    return [tag, c.value];
  }

  export function isTaggedValue(c: Cbor): boolean {
    return c.type === MajorType.Tagged;
  }

  export function asTaggedValue(c: Cbor): [Tag, Cbor] | undefined {
    if (c.type !== MajorType.Tagged) {
      return undefined;
    }
    const tag: Tag = { value: c.tag, name: `tag-${c.tag}` };
    return [tag, c.value];
  }

  export function tryTaggedValue(c: Cbor): [Tag, Cbor] {
    return tryIntoTaggedValue(c);
  }

  export function tryIntoExpectedTaggedValue(c: Cbor, expectedTag: CborNumber | Tag): Cbor {
    const [tag, value] = tryIntoTaggedValue(c);
    const expectedValue = typeof expectedTag === 'object' && 'value' in expectedTag ? expectedTag.value : expectedTag;
    if (tag.value !== expectedValue) {
      throw new Error(`Wrong tag: expected ${expectedValue}, got ${tag.value}`);
    }
    return value;
  }

  export function tryExpectedTaggedValue(c: Cbor, expectedTag: CborNumber | Tag): Cbor {
    return tryIntoExpectedTaggedValue(c, expectedTag);
  }

  // Text String conveniences

  export function tryIntoText(c: Cbor): string {
    if (c.type !== MajorType.Text) {
      throw new Error('Wrong type');
    }
    return c.value;
  }

  export function isText(c: Cbor): boolean {
    return c.type === MajorType.Text;
  }

  export function tryText(c: Cbor): string {
    return tryIntoText(c);
  }

  export function intoText(c: Cbor): string | undefined {
    try {
      return tryIntoText(c);
    } catch {
      return undefined;
    }
  }

  export function asText(c: Cbor): string | undefined {
    return c.type === MajorType.Text ? c.value : undefined;
  }

  // Array conveniences

  export function tryIntoArray(c: Cbor): Cbor[] {
    if (c.type !== MajorType.Array) {
      throw new Error('Wrong type');
    }
    return c.value;
  }

  export function isArray(c: Cbor): boolean {
    return c.type === MajorType.Array;
  }

  export function tryArray(c: Cbor): Cbor[] {
    return tryIntoArray(c);
  }

  export function intoArray(c: Cbor): Cbor[] | undefined {
    try {
      return tryIntoArray(c);
    } catch {
      return undefined;
    }
  }

  export function asArray(c: Cbor): Cbor[] | undefined {
    return c.type === MajorType.Array ? c.value : undefined;
  }

  // Map conveniences

  export function tryIntoMap(c: Cbor): import('./map').CborMap {
    if (c.type !== MajorType.Map) {
      throw new Error('Wrong type');
    }
    return c.value;
  }

  export function isMap(c: Cbor): boolean {
    return c.type === MajorType.Map;
  }

  export function tryMap(c: Cbor): import('./map').CborMap {
    return tryIntoMap(c);
  }

  export function intoMap(c: Cbor): import('./map').CborMap | undefined {
    try {
      return tryIntoMap(c);
    } catch {
      return undefined;
    }
  }

  export function asMap(c: Cbor): import('./map').CborMap | undefined {
    return c.type === MajorType.Map ? c.value : undefined;
  }

  export function tryIntoSimpleValue(c: Cbor): Simple {
    if (c.type !== MajorType.Simple) {
      throw new Error('Wrong type');
    }
    return c.value;
  }

  // Boolean conveniences

  export function cborFalse(): Cbor {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'False' } };
  }

  export function cborTrue(): Cbor {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'True' } };
  }

  export function asBool(c: Cbor): boolean | undefined {
    if (c.type !== MajorType.Simple) return undefined;
    if (c.value.type === 'True') return true;
    if (c.value.type === 'False') return false;
    return undefined;
  }

  export function tryIntoBool(c: Cbor): boolean {
    const result = asBool(c);
    if (result === undefined) {
      throw new Error('Wrong type');
    }
    return result;
  }

  export function isBool(c: Cbor): boolean {
    return c.type === MajorType.Simple &&
           (c.value.type === 'True' || c.value.type === 'False');
  }

  export function tryBool(c: Cbor): boolean {
    return tryIntoBool(c);
  }

  export function isTrue(c: Cbor): boolean {
    return c.type === MajorType.Simple && c.value.type === 'True';
  }

  export function isFalse(c: Cbor): boolean {
    return c.type === MajorType.Simple && c.value.type === 'False';
  }

  // Null conveniences

  export function cborNull(): Cbor {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'Null' } };
  }

  export function isNull(c: Cbor): boolean {
    return c.type === MajorType.Simple && c.value.type === 'Null';
  }

  // Number conveniences

  export function isNumber(c: Cbor): boolean {
    if (c.type === MajorType.Unsigned || c.type === MajorType.Negative) {
      return true;
    }
    if (c.type === MajorType.Simple) {
      return isSimpleFloat(c.value);
    }
    return false;
  }

  export function isNaN(c: Cbor): boolean {
    if (c.type !== MajorType.Simple) return false;
    return isSimpleNaN(c.value);
  }

  export function cborNaN(): Cbor {
    return { isCbor: true, type: MajorType.Simple, value: { type: 'Float', value: NaN } };
  }
}

// Re-export commonly used convenience functions at top level for easier access
export const toTaggedValue = CborConvenience.toTaggedValue;
