/**
 * Tests for CBOR convenience utilities.
 */

import { describe, test, expect } from '@jest/globals';
import { Cbor, MajorType } from './cbor';
import { cbor } from './encode';
import { CborMap } from './map';
import * as conv from './conveniences';

// ============================================================================
// Type Guards Tests
// ============================================================================

describe('Type Guards', () => {
  test('isUnsigned() detects unsigned integers', () => {
    expect(conv.isUnsigned(cbor(42))).toBe(true);
    expect(conv.isUnsigned(cbor(0))).toBe(true);
    expect(conv.isUnsigned(cbor(-1))).toBe(false);
    expect(conv.isUnsigned(cbor('text'))).toBe(false);
  });

  test('isNegative() detects negative integers', () => {
    expect(conv.isNegative(cbor(-1))).toBe(true);
    expect(conv.isNegative(cbor(-100))).toBe(true);
    expect(conv.isNegative(cbor(42))).toBe(false);
    expect(conv.isNegative(cbor('text'))).toBe(false);
  });

  test('isInteger() detects any integer', () => {
    expect(conv.isInteger(cbor(42))).toBe(true);
    expect(conv.isInteger(cbor(-1))).toBe(true);
    expect(conv.isInteger(cbor(0))).toBe(true);
    expect(conv.isInteger(cbor('text'))).toBe(false);
    expect(conv.isInteger(cbor(3.14))).toBe(false);
  });

  test('isBytes() detects byte strings', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(conv.isBytes(cbor(bytes))).toBe(true);
    expect(conv.isBytes(cbor('text'))).toBe(false);
    expect(conv.isBytes(cbor(42))).toBe(false);
  });

  test('isText() detects text strings', () => {
    expect(conv.isText(cbor('hello'))).toBe(true);
    expect(conv.isText(cbor(''))).toBe(true);
    expect(conv.isText(cbor(42))).toBe(false);
    expect(conv.isText(cbor(new Uint8Array()))).toBe(false);
  });

  test('isArray() detects arrays', () => {
    expect(conv.isArray(cbor([1, 2, 3]))).toBe(true);
    expect(conv.isArray(cbor([]))).toBe(true);
    expect(conv.isArray(cbor(42))).toBe(false);
    expect(conv.isArray(cbor('text'))).toBe(false);
  });

  test('isMap() detects maps', () => {
    const map = new CborMap();
    expect(conv.isMap(cbor(map))).toBe(true);
    expect(conv.isMap(cbor(42))).toBe(false);
    expect(conv.isMap(cbor([]))).toBe(false);
  });

  test('isTagged() detects tagged values', () => {
    const tagged: Cbor = {
      isCbor: true as const,
      type: MajorType.Tagged as MajorType.Tagged,
      tag: 1,
      value: cbor(123456),
    };
    expect(conv.isTagged(tagged)).toBe(true);
    expect(conv.isTagged(cbor(42))).toBe(false);
  });

  test('isBoolean() detects booleans', () => {
    expect(conv.isBoolean(cbor(true))).toBe(true);
    expect(conv.isBoolean(cbor(false))).toBe(true);
    expect(conv.isBoolean(cbor(42))).toBe(false);
    expect(conv.isBoolean(cbor(null))).toBe(false);
  });

  test('isNull() detects null', () => {
    expect(conv.isNull(cbor(null))).toBe(true);
    expect(conv.isNull(cbor(42))).toBe(false);
    expect(conv.isNull(cbor(false))).toBe(false);
  });

  test('isFloat() detects floats', () => {
    expect(conv.isFloat(cbor(3.14))).toBe(true);
    expect(conv.isFloat(cbor(42))).toBe(false);
    expect(conv.isFloat(cbor('text'))).toBe(false);
  });
});

// ============================================================================
// Safe Extraction Tests
// ============================================================================

describe('Safe Extraction (as* functions)', () => {
  test('asUnsigned() extracts unsigned integers', () => {
    expect(conv.asUnsigned(cbor(42))).toBe(42);
    expect(conv.asUnsigned(cbor(0))).toBe(0);
    expect(conv.asUnsigned(cbor(-1))).toBe(undefined);
    expect(conv.asUnsigned(cbor('text'))).toBe(undefined);
  });

  test('asNegative() extracts negative integers', () => {
    expect(conv.asNegative(cbor(-1))).toBe(-1);
    expect(conv.asNegative(cbor(-100))).toBe(-100);
    expect(conv.asNegative(cbor(42))).toBe(undefined);
  });

  test('asInteger() extracts any integer', () => {
    expect(conv.asInteger(cbor(42))).toBe(42);
    expect(conv.asInteger(cbor(-1))).toBe(-1);
    expect(conv.asInteger(cbor(0))).toBe(0);
    expect(conv.asInteger(cbor('text'))).toBe(undefined);
  });

  test('asBytes() extracts byte strings', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = conv.asBytes(cbor(bytes));
    expect(result).toEqual(bytes);
    expect(conv.asBytes(cbor('text'))).toBe(undefined);
  });

  test('asText() extracts text strings', () => {
    expect(conv.asText(cbor('hello'))).toBe('hello');
    expect(conv.asText(cbor(''))).toBe('');
    expect(conv.asText(cbor(42))).toBe(undefined);
  });

  test('asArray() extracts arrays', () => {
    const arr = conv.asArray(cbor([1, 2, 3]));
    expect(arr).toBeDefined();
    expect(arr?.length).toBe(3);
    expect(conv.asArray(cbor(42))).toBe(undefined);
  });

  test('asMap() extracts maps', () => {
    const map = new CborMap();
    map.set('key', 'value');
    const result = conv.asMap(cbor(map));
    expect(result).toBeDefined();
    expect(result?.size).toBe(1);
    expect(conv.asMap(cbor(42))).toBe(undefined);
  });

  test('asBoolean() extracts booleans', () => {
    expect(conv.asBoolean(cbor(true))).toBe(true);
    expect(conv.asBoolean(cbor(false))).toBe(false);
    expect(conv.asBoolean(cbor(42))).toBe(undefined);
  });

  test('asFloat() extracts floats', () => {
    expect(conv.asFloat(cbor(3.14))).toBeCloseTo(3.14);
    expect(conv.asFloat(cbor(42))).toBe(undefined);
  });

  test('asNumber() extracts any number', () => {
    expect(conv.asNumber(cbor(42))).toBe(42);
    expect(conv.asNumber(cbor(-1))).toBe(-1);
    expect(conv.asNumber(cbor(3.14))).toBeCloseTo(3.14);
    expect(conv.asNumber(cbor('text'))).toBe(undefined);
  });
});

// ============================================================================
// Expectation Tests
// ============================================================================

describe('Expectations (expect* functions)', () => {
  test('expectUnsigned() extracts or throws', () => {
    expect(conv.expectUnsigned(cbor(42))).toBe(42);
    expect(() => conv.expectUnsigned(cbor(-1))).toThrow('Expected unsigned integer');
    expect(() => conv.expectUnsigned(cbor('text'))).toThrow();
  });

  test('expectNegative() extracts or throws', () => {
    expect(conv.expectNegative(cbor(-1))).toBe(-1);
    expect(() => conv.expectNegative(cbor(42))).toThrow('Expected negative integer');
  });

  test('expectInteger() extracts or throws', () => {
    expect(conv.expectInteger(cbor(42))).toBe(42);
    expect(conv.expectInteger(cbor(-1))).toBe(-1);
    expect(() => conv.expectInteger(cbor('text'))).toThrow('Expected integer');
  });

  test('expectBytes() extracts or throws', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(conv.expectBytes(cbor(bytes))).toEqual(bytes);
    expect(() => conv.expectBytes(cbor('text'))).toThrow('Expected byte string');
  });

  test('expectText() extracts or throws', () => {
    expect(conv.expectText(cbor('hello'))).toBe('hello');
    expect(() => conv.expectText(cbor(42))).toThrow('Expected text string');
  });

  test('expectArray() extracts or throws', () => {
    const arr = conv.expectArray(cbor([1, 2, 3]));
    expect(arr.length).toBe(3);
    expect(() => conv.expectArray(cbor(42))).toThrow('Expected array');
  });

  test('expectMap() extracts or throws', () => {
    const map = new CborMap();
    const result = conv.expectMap(cbor(map));
    expect(result).toBeDefined();
    expect(() => conv.expectMap(cbor(42))).toThrow('Expected map');
  });

  test('expectBoolean() extracts or throws', () => {
    expect(conv.expectBoolean(cbor(true))).toBe(true);
    expect(conv.expectBoolean(cbor(false))).toBe(false);
    expect(() => conv.expectBoolean(cbor(42))).toThrow('Expected boolean');
  });

  test('expectFloat() extracts or throws', () => {
    expect(conv.expectFloat(cbor(3.14))).toBeCloseTo(3.14);
    expect(() => conv.expectFloat(cbor(42))).toThrow('Expected float');
  });

  test('expectNumber() extracts or throws', () => {
    expect(conv.expectNumber(cbor(42))).toBe(42);
    expect(conv.expectNumber(cbor(3.14))).toBeCloseTo(3.14);
    expect(() => conv.expectNumber(cbor('text'))).toThrow('Expected number');
  });
});

// ============================================================================
// Array Operations Tests
// ============================================================================

describe('Array Operations', () => {
  const testArray = cbor([10, 20, 30, 40, 50]);

  test('arrayItem() gets item at index', () => {
    expect(conv.asInteger(conv.arrayItem(testArray, 0)!)).toBe(10);
    expect(conv.asInteger(conv.arrayItem(testArray, 2)!)).toBe(30);
    expect(conv.asInteger(conv.arrayItem(testArray, 4)!)).toBe(50);
  });

  test('arrayItem() returns undefined for out of bounds', () => {
    expect(conv.arrayItem(testArray, -1)).toBe(undefined);
    expect(conv.arrayItem(testArray, 5)).toBe(undefined);
    expect(conv.arrayItem(testArray, 100)).toBe(undefined);
  });

  test('arrayItem() returns undefined for non-array', () => {
    expect(conv.arrayItem(cbor(42), 0)).toBe(undefined);
  });

  test('arrayLength() gets array length', () => {
    expect(conv.arrayLength(cbor([1, 2, 3]))).toBe(3);
    expect(conv.arrayLength(cbor([]))).toBe(0);
    expect(conv.arrayLength(cbor(42))).toBe(undefined);
  });

  test('arrayIsEmpty() checks if empty', () => {
    expect(conv.arrayIsEmpty(cbor([]))).toBe(true);
    expect(conv.arrayIsEmpty(cbor([1, 2, 3]))).toBe(false);
    expect(conv.arrayIsEmpty(cbor(42))).toBe(undefined);
  });
});

// ============================================================================
// Map Operations Tests
// ============================================================================

describe('Map Operations', () => {
  const testMap = (() => {
    const map = new CborMap();
    map.set('name', 'Alice');
    map.set('age', 30);
    map.set('active', true);
    return cbor(map);
  })();

  test('mapValue() gets value by key', () => {
    expect(conv.mapValue<string, string>(testMap, 'name')).toBe('Alice');
    expect(conv.mapValue<string, number>(testMap, 'age')).toBe(30);
    expect(conv.mapValue(testMap, 'missing')).toBe(undefined);
  });

  test('mapValue() returns undefined for non-map', () => {
    expect(conv.mapValue(cbor(42), 'key')).toBe(undefined);
  });

  test('mapHas() checks key existence', () => {
    expect(conv.mapHas(testMap, 'name')).toBe(true);
    expect(conv.mapHas(testMap, 'age')).toBe(true);
    expect(conv.mapHas(testMap, 'missing')).toBe(false);
    expect(conv.mapHas(cbor(42), 'key')).toBe(undefined);
  });

  test('mapKeys() gets all keys', () => {
    const keys = conv.mapKeys(testMap);
    expect(keys).toBeDefined();
    expect(keys?.length).toBe(3);
    expect(conv.mapKeys(cbor(42))).toBe(undefined);
  });

  test('mapValues() gets all values', () => {
    const values = conv.mapValues(testMap);
    expect(values).toBeDefined();
    expect(values?.length).toBe(3);
    expect(conv.mapValues(cbor(42))).toBe(undefined);
  });

  test('mapSize() gets map size', () => {
    expect(conv.mapSize(testMap)).toBe(3);
    const emptyMap = cbor(new CborMap());
    expect(conv.mapSize(emptyMap)).toBe(0);
    expect(conv.mapSize(cbor(42))).toBe(undefined);
  });

  test('mapIsEmpty() checks if empty', () => {
    expect(conv.mapIsEmpty(cbor(new CborMap()))).toBe(true);
    expect(conv.mapIsEmpty(testMap)).toBe(false);
    expect(conv.mapIsEmpty(cbor(42))).toBe(undefined);
  });
});

// ============================================================================
// Tagged Value Operations Tests
// ============================================================================

describe('Tagged Value Operations', () => {
  const tagged: Cbor = {
    isCbor: true as const,
    type: MajorType.Tagged as MajorType.Tagged,
    tag: 42,
    value: cbor('content'),
  };

  test('tagValue() gets tag value', () => {
    expect(conv.tagValue(tagged)).toBe(42);
    expect(conv.tagValue(cbor(123))).toBe(undefined);
  });

  test('tagContent() gets tagged content', () => {
    const content = conv.tagContent(tagged);
    expect(content).toBeDefined();
    expect(conv.asText(content!)).toBe('content');
    expect(conv.tagContent(cbor(123))).toBe(undefined);
  });

  test('hasTag() checks for specific tag', () => {
    expect(conv.hasTag(tagged, 42)).toBe(true);
    expect(conv.hasTag(tagged, 99)).toBe(false);
    expect(conv.hasTag(cbor(123), 42)).toBe(false);
  });

  test('getTaggedContent() gets content for specific tag', () => {
    const content = conv.getTaggedContent(tagged, 42);
    expect(content).toBeDefined();
    expect(conv.getTaggedContent(tagged, 99)).toBe(undefined);
    expect(conv.getTaggedContent(cbor(123), 42)).toBe(undefined);
  });

  test('expectTaggedContent() gets content or throws', () => {
    const content = conv.expectTaggedContent(tagged, 42);
    expect(content).toBeDefined();
    expect(conv.asText(content)).toBe('content');
    expect(() => conv.expectTaggedContent(tagged, 99)).toThrow('Expected tag 99');
    expect(() => conv.expectTaggedContent(cbor(123), 42)).toThrow();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Scenarios', () => {
  test('complex nested structure', () => {
    const map = new CborMap();
    map.set('users', [
      (() => {
        const user1 = new CborMap();
        user1.set('name', 'Alice');
        user1.set('age', 30);
        return cbor(user1);
      })(),
      (() => {
        const user2 = new CborMap();
        user2.set('name', 'Bob');
        user2.set('age', 25);
        return cbor(user2);
      })(),
    ]);
    const data = cbor(map);

    // Navigate to users array
    const usersArray = conv.mapValue<string, Cbor[]>(data, 'users');
    expect(usersArray).toBeDefined();
    expect(usersArray?.length).toBe(2);

    // Get first user
    const user1 = usersArray![0];
    expect(conv.isMap(user1)).toBe(true);
    expect(conv.mapValue<string, string>(user1, 'name')).toBe('Alice');
    expect(conv.mapValue<string, number>(user1, 'age')).toBe(30);
  });

  test('type-safe extraction chain', () => {
    const data = cbor([1, 2, 3, 4, 5]);

    const arr = conv.expectArray(data);
    expect(arr.length).toBe(5);

    const firstItem = conv.arrayItem(data, 0);
    expect(firstItem).toBeDefined();
    expect(conv.expectUnsigned(firstItem!)).toBe(1);
  });

  test('safe extraction with fallbacks', () => {
    const data = cbor({ key: 'value' }); // Will be a map

    const asNum = conv.asInteger(data);
    expect(asNum).toBe(undefined);

    const asMap = conv.asMap(data);
    expect(asMap).toBeDefined();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  test('empty collections', () => {
    expect(conv.arrayLength(cbor([]))).toBe(0);
    expect(conv.arrayIsEmpty(cbor([]))).toBe(true);
    expect(conv.mapSize(cbor(new CborMap()))).toBe(0);
    expect(conv.mapIsEmpty(cbor(new CborMap()))).toBe(true);
  });

  test('zero values', () => {
    expect(conv.asInteger(cbor(0))).toBe(0);
    expect(conv.expectUnsigned(cbor(0))).toBe(0);
  });

  test('empty strings', () => {
    expect(conv.asText(cbor(''))).toBe('');
    expect(conv.expectText(cbor(''))).toBe('');
  });

  test('empty byte strings', () => {
    const empty = new Uint8Array(0);
    expect(conv.asBytes(cbor(empty))).toEqual(empty);
    expect(conv.expectBytes(cbor(empty))).toEqual(empty);
  });

  test('large numbers', () => {
    const large = 1000000;
    expect(conv.asInteger(cbor(large))).toBe(large);
    expect(conv.expectUnsigned(cbor(large))).toBe(large);
  });

  test('negative zero', () => {
    // In JavaScript, -0 === 0 but Object.is(-0, 0) is false
    // CBOR encodes -0 as negative integer -1 (which represents -0 in CBOR)
    const result = conv.asInteger(cbor(-0));
    expect(result === 0 || result === -0).toBe(true);
  });
});
