/**
 * Convenience utilities for working with CBOR values.
 *
 * Provides type-safe helpers for checking types, extracting values,
 * and working with arrays, maps, and tagged values.
 *
 * @module conveniences
 */

import { Cbor, MajorType, CborNumber, CborEncodable } from './cbor';
import { CborMap } from './map';
import { isFloat as isSimpleFloat } from './simple';
import { decodeCbor } from './decode';

// ============================================================================
// Extraction
// ============================================================================

/**
 * Extract native JavaScript value from CBOR.
 * Converts CBOR types to their JavaScript equivalents.
 */
export function extractCbor(cbor: Cbor | Uint8Array): unknown {
  let c: Cbor;
  if (cbor instanceof Uint8Array) {
    c = decodeCbor(cbor);
  } else {
    c = cbor;
  }
  switch (c.type) {
    case MajorType.Unsigned:
      return c.value;
    case MajorType.Negative:
      if (typeof c.value === 'bigint') {
        return -c.value - 1n;
      } else {
        return -c.value - 1;
      }
    case MajorType.ByteString:
      return c.value;
    case MajorType.Text:
      return c.value;
    case MajorType.Array:
      return c.value.map(extractCbor);
    case MajorType.Map:
      return c.value;
    case MajorType.Tagged:
      return c;
    case MajorType.Simple:
      if (c.value.type === 'True') return true;
      if (c.value.type === 'False') return false;
      if (c.value.type === 'Null') return null;
      if (c.value.type === 'Float') return c.value.value;
      return c;
  }
  return undefined;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if CBOR value is an unsigned integer.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is unsigned integer
 *
 * @example
 * ```typescript
 * if (isUnsigned(value)) {
 *   console.log('Unsigned:', value.value);
 * }
 * ```
 */
export function isUnsigned(cbor: Cbor): boolean {
  return cbor.type === MajorType.Unsigned;
}

/**
 * Check if CBOR value is a negative integer.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is negative integer
 */
export function isNegative(cbor: Cbor): boolean {
  return cbor.type === MajorType.Negative;
}

/**
 * Check if CBOR value is any integer (unsigned or negative).
 *
 * @param cbor - CBOR value to check
 * @returns True if value is an integer
 */
export function isInteger(cbor: Cbor): boolean {
  return cbor.type === MajorType.Unsigned || cbor.type === MajorType.Negative;
}

/**
 * Check if CBOR value is a byte string.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is byte string
 */
export function isBytes(cbor: Cbor): boolean {
  return cbor.type === MajorType.ByteString;
}

/**
 * Check if CBOR value is a text string.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is text string
 */
export function isText(cbor: Cbor): boolean {
  return cbor.type === MajorType.Text;
}

/**
 * Check if CBOR value is an array.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is array
 */
export function isArray(cbor: Cbor): boolean {
  return cbor.type === MajorType.Array;
}

/**
 * Check if CBOR value is a map.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is map
 */
export function isMap(cbor: Cbor): boolean {
  return cbor.type === MajorType.Map;
}

/**
 * Check if CBOR value is tagged.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is tagged
 */
export function isTagged(cbor: Cbor): boolean {
  return cbor.type === MajorType.Tagged;
}

/**
 * Check if CBOR value is a simple value.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is simple
 */
export function isSimple(cbor: Cbor): boolean {
  return cbor.type === MajorType.Simple;
}

/**
 * Check if CBOR value is a boolean (true or false).
 *
 * @param cbor - CBOR value to check
 * @returns True if value is boolean
 */
export function isBoolean(cbor: Cbor): boolean {
  if (cbor.type !== MajorType.Simple) {
    return false;
  }
  return cbor.value.type === 'False' || cbor.value.type === 'True';
}

/**
 * Check if CBOR value is null.
 *
 * @param cbor - CBOR value to check
 * @returns True if value is null
 */
export function isNull(cbor: Cbor): boolean {
  if (cbor.type !== MajorType.Simple) {
    return false;
  }
  return cbor.value.type === 'Null';
}

/**
 * Check if CBOR value is a float (f16, f32, or f64).
 *
 * @param cbor - CBOR value to check
 * @returns True if value is float
 */
export function isFloat(cbor: Cbor): boolean {
  if (cbor.type !== MajorType.Simple) {
    return false;
  }
  return isSimpleFloat(cbor.value);
}

// ============================================================================
// Safe Extraction (returns undefined on type mismatch)
// ============================================================================

/**
 * Extract unsigned integer value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Unsigned integer or undefined
 */
export function asUnsigned(cbor: Cbor): number | bigint | undefined {
  if (cbor.type === MajorType.Unsigned) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract negative integer value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Negative integer or undefined
 */
export function asNegative(cbor: Cbor): number | bigint | undefined {
  if (cbor.type === MajorType.Negative) {
    // Convert stored magnitude back to actual negative value
    if (typeof cbor.value === 'bigint') {
      return -cbor.value - 1n;
    } else {
      return -cbor.value - 1;
    }
  }
  return undefined;
}

/**
 * Extract any integer value (unsigned or negative) if type matches.
 *
 * @param cbor - CBOR value
 * @returns Integer or undefined
 */
export function asInteger(cbor: Cbor): number | bigint | undefined {
  if (cbor.type === MajorType.Unsigned) {
    return cbor.value;
  } else if (cbor.type === MajorType.Negative) {
    // Convert stored magnitude back to actual negative value
    if (typeof cbor.value === 'bigint') {
      return -cbor.value - 1n;
    } else {
      return -cbor.value - 1;
    }
  }
  return undefined;
}

/**
 * Extract byte string value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Byte string or undefined
 */
export function asBytes(cbor: Cbor): Uint8Array | undefined {
  if (cbor.type === MajorType.ByteString) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract text string value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Text string or undefined
 */
export function asText(cbor: Cbor): string | undefined {
  if (cbor.type === MajorType.Text) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract array value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Array or undefined
 */
export function asArray(cbor: Cbor): Cbor[] | undefined {
  if (cbor.type === MajorType.Array) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract map value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Map or undefined
 */
export function asMap(cbor: Cbor): CborMap | undefined {
  if (cbor.type === MajorType.Map) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract boolean value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Boolean or undefined
 */
export function asBoolean(cbor: Cbor): boolean | undefined {
  if (cbor.type !== MajorType.Simple) {
    return undefined;
  }
  if (cbor.value.type === 'True') {
    return true;
  }
  if (cbor.value.type === 'False') {
    return false;
  }
  return undefined;
}

/**
 * Extract float value if type matches.
 *
 * @param cbor - CBOR value
 * @returns Float or undefined
 */
export function asFloat(cbor: Cbor): number | undefined {
  if (cbor.type !== MajorType.Simple) {
    return undefined;
  }
  const simple = cbor.value;
  if (isSimpleFloat(simple)) {
    return simple.value;
  }
  return undefined;
}

/**
 * Extract any numeric value (integer or float).
 *
 * @param cbor - CBOR value
 * @returns Number or undefined
 */
export function asNumber(cbor: Cbor): CborNumber | undefined {
  if (cbor.type === MajorType.Unsigned) {
    return cbor.value;
  }
  if (cbor.type === MajorType.Negative) {
    // Convert stored magnitude back to actual negative value
    if (typeof cbor.value === 'bigint') {
      return -cbor.value - 1n;
    } else {
      return -cbor.value - 1;
    }
  }
  if (cbor.type === MajorType.Simple) {
    const simple = cbor.value;
    if (isSimpleFloat(simple)) {
      return simple.value;
    }
  }
  return undefined;
}

// ============================================================================
// Expectations (throw on type mismatch)
// ============================================================================

/**
 * Extract unsigned integer value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Unsigned integer
 * @throws Error if not unsigned integer
 */
export function expectUnsigned(cbor: Cbor): number | bigint {
  const value = asUnsigned(cbor);
  if (value === undefined) {
    throw new Error(`Expected unsigned integer, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract negative integer value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Negative integer
 * @throws Error if not negative integer
 */
export function expectNegative(cbor: Cbor): number | bigint {
  const value = asNegative(cbor);
  if (value === undefined) {
    throw new Error(`Expected negative integer, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract any integer value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Integer
 * @throws Error if not integer
 */
export function expectInteger(cbor: Cbor): number | bigint {
  const value = asInteger(cbor);
  if (value === undefined) {
    throw new Error(`Expected integer, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract byte string value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Byte string
 * @throws Error if not byte string
 */
export function expectBytes(cbor: Cbor): Uint8Array {
  const value = asBytes(cbor);
  if (value === undefined) {
    throw new Error(`Expected byte string, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract text string value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Text string
 * @throws Error if not text string
 */
export function expectText(cbor: Cbor): string {
  const value = asText(cbor);
  if (value === undefined) {
    throw new Error(`Expected text string, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract array value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Array
 * @throws Error if not array
 */
export function expectArray(cbor: Cbor): Cbor[] {
  const value = asArray(cbor);
  if (value === undefined) {
    throw new Error(`Expected array, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract map value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Map
 * @throws Error if not map
 */
export function expectMap(cbor: Cbor): CborMap {
  const value = asMap(cbor);
  if (value === undefined) {
    throw new Error(`Expected map, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract boolean value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Boolean
 * @throws Error if not boolean
 */
export function expectBoolean(cbor: Cbor): boolean {
  const value = asBoolean(cbor);
  if (value === undefined) {
    throw new Error(`Expected boolean, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract float value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Float
 * @throws Error if not float
 */
export function expectFloat(cbor: Cbor): number {
  const value = asFloat(cbor);
  if (value === undefined) {
    throw new Error(`Expected float, got ${cbor.type}`);
  }
  return value;
}

/**
 * Extract any numeric value, throwing if type doesn't match.
 *
 * @param cbor - CBOR value
 * @returns Number
 * @throws Error if not number
 */
export function expectNumber(cbor: Cbor): CborNumber {
  const value = asNumber(cbor);
  if (value === undefined) {
    throw new Error(`Expected number, got ${cbor.type}`);
  }
  return value;
}

// ============================================================================
// Array Operations
// ============================================================================

/**
 * Get array item at index.
 *
 * @param cbor - CBOR value (must be array)
 * @param index - Array index
 * @returns Item at index or undefined
 */
export function arrayItem(cbor: Cbor, index: number): Cbor | undefined {
  if (cbor.type !== MajorType.Array) {
    return undefined;
  }
  const array = cbor.value;
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Get array length.
 *
 * @param cbor - CBOR value (must be array)
 * @returns Array length or undefined
 */
export function arrayLength(cbor: Cbor): number | undefined {
  if (cbor.type !== MajorType.Array) {
    return undefined;
  }
  return cbor.value.length;
}

/**
 * Check if array is empty.
 *
 * @param cbor - CBOR value (must be array)
 * @returns True if empty, false if not empty, undefined if not array
 */
export function arrayIsEmpty(cbor: Cbor): boolean | undefined {
  if (cbor.type !== MajorType.Array) {
    return undefined;
  }
  return cbor.value.length === 0;
}

// ============================================================================
// Map Operations
// ============================================================================

/**
 * Get map value by key.
 *
 * @param cbor - CBOR value (must be map)
 * @param key - Map key
 * @returns Value for key or undefined
 */
export function mapValue<K extends CborEncodable, V>(cbor: Cbor, key: K): V | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.get<K, V>(key);
}

/**
 * Check if map has key.
 *
 * @param cbor - CBOR value (must be map)
 * @param key - Map key
 * @returns True if key exists, false otherwise, undefined if not map
 */
export function mapHas<K extends CborEncodable>(cbor: Cbor, key: K): boolean | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.has(key);
}

/**
 * Get all map keys.
 *
 * @param cbor - CBOR value (must be map)
 * @returns Array of keys or undefined
 */
export function mapKeys(cbor: Cbor): Cbor[] | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.entries.map(e => e.key);
}

/**
 * Get all map values.
 *
 * @param cbor - CBOR value (must be map)
 * @returns Array of values or undefined
 */
export function mapValues(cbor: Cbor): Cbor[] | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.entries.map(e => e.value);
}

/**
 * Get map size.
 *
 * @param cbor - CBOR value (must be map)
 * @returns Map size or undefined
 */
export function mapSize(cbor: Cbor): number | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.size;
}

/**
 * Check if map is empty.
 *
 * @param cbor - CBOR value (must be map)
 * @returns True if empty, false if not empty, undefined if not map
 */
export function mapIsEmpty(cbor: Cbor): boolean | undefined {
  if (cbor.type !== MajorType.Map) {
    return undefined;
  }
  const map = cbor.value as CborMap;
  return map.size === 0;
}

// ============================================================================
// Tagged Value Operations
// ============================================================================

/**
 * Get tag value from tagged CBOR.
 *
 * @param cbor - CBOR value (must be tagged)
 * @returns Tag value or undefined
 */
export function tagValue(cbor: Cbor): number | bigint | undefined {
  if (cbor.type !== MajorType.Tagged) {
    return undefined;
  }
  return cbor.tag;
}

/**
 * Get content from tagged CBOR.
 *
 * @param cbor - CBOR value (must be tagged)
 * @returns Tagged content or undefined
 */
export function tagContent(cbor: Cbor): Cbor | undefined {
  if (cbor.type !== MajorType.Tagged) {
    return undefined;
  }
  return cbor.value;
}

/**
 * Check if CBOR has specific tag.
 *
 * @param cbor - CBOR value
 * @param tag - Tag value to check
 * @returns True if has tag, false otherwise
 */
export function hasTag(cbor: Cbor, tag: number | bigint): boolean {
  if (cbor.type !== MajorType.Tagged) {
    return false;
  }
  return cbor.tag === tag;
}

/**
 * Extract content if has specific tag.
 *
 * @param cbor - CBOR value
 * @param tag - Expected tag value
 * @returns Tagged content or undefined
 */
export function getTaggedContent(cbor: Cbor, tag: number | bigint): Cbor | undefined {
  if (cbor.type === MajorType.Tagged && cbor.tag === tag) {
    return cbor.value;
  }
  return undefined;
}

/**
 * Extract content if has specific tag, throwing if not.
 *
 * @param cbor - CBOR value
 * @param tag - Expected tag value
 * @returns Tagged content
 * @throws Error if not tagged with expected tag
 */
export function expectTaggedContent(cbor: Cbor, tag: number | bigint): Cbor {
  const content = getTaggedContent(cbor, tag);
  if (content === undefined) {
    throw new Error(`Expected tag ${tag}, got ${cbor.type}`);
  }
  return content;
}
