/**
 * Tests for CBOR Set support.
 */

import { CborSet } from './set';
import { MajorType } from './cbor';
import { extractCbor } from './extract';
import { getTagValue } from './cbor-tagged';
import { TAG_SET } from './tags';
import { cbor } from './encode';

describe('CborSet Tests', () => {
  describe('Factory Methods', () => {
    test('creates set from array', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      expect(set.size).toBe(3);
      expect(set.contains(1)).toBe(true);
      expect(set.contains(2)).toBe(true);
      expect(set.contains(3)).toBe(true);
    });

    test('removes duplicates from array', () => {
      const set = CborSet.fromArray([1, 2, 3, 2, 1]);
      expect(set.size).toBe(3);
    });

    test('creates empty set from empty array', () => {
      const set = CborSet.fromArray([]);
      expect(set.size).toBe(0);
      expect(set.isEmpty()).toBe(true);
    });

    test('creates set from JavaScript Set', () => {
      const jsSet = new Set([1, 2, 3]);
      const cborSet = CborSet.fromSet(jsSet);
      expect(cborSet.size).toBe(3);
      expect(cborSet.contains(1)).toBe(true);
    });

    test('creates set from iterable', () => {
      const iterable = [1, 2, 3];
      const set = CborSet.fromIterable(iterable);
      expect(set.size).toBe(3);
    });

    test('creates set with mixed types', () => {
      const set = CborSet.fromArray([1, 'hello', true, null]);
      expect(set.size).toBe(4);
      expect(set.contains(1)).toBe(true);
      expect(set.contains('hello')).toBe(true);
      expect(set.contains(true)).toBe(true);
      expect(set.contains(null)).toBe(true);
    });
  });

  describe('Core Methods', () => {
    test('inserts element', () => {
      const set = new CborSet();
      set.insert(42);
      expect(set.size).toBe(1);
      expect(set.contains(42)).toBe(true);
    });

    test('insert duplicate has no effect', () => {
      const set = new CborSet();
      set.insert(42);
      set.insert(42);
      expect(set.size).toBe(1);
    });

    test('contains checks membership', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      expect(set.contains(2)).toBe(true);
      expect(set.contains(99)).toBe(false);
    });

    test('delete removes element', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const result = set.delete(2);
      expect(result).toBe(true);
      expect(set.size).toBe(2);
      expect(set.contains(2)).toBe(false);
    });

    test('delete non-existent returns false', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const result = set.delete(99);
      expect(result).toBe(false);
      expect(set.size).toBe(3);
    });

    test('clear removes all elements', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      set.clear();
      expect(set.size).toBe(0);
      expect(set.isEmpty()).toBe(true);
    });

    test('size returns element count', () => {
      const set = CborSet.fromArray([1, 2, 3, 4, 5]);
      expect(set.size).toBe(5);
    });

    test('isEmpty checks for empty set', () => {
      const empty = new CborSet();
      const notEmpty = CborSet.fromArray([1]);

      expect(empty.isEmpty()).toBe(true);
      expect(notEmpty.isEmpty()).toBe(false);
    });
  });

  describe('Set Operations', () => {
    test('union combines elements', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([3, 4, 5]);
      const union = set1.union(set2);

      expect(union.size).toBe(5);
      expect(union.contains(1)).toBe(true);
      expect(union.contains(2)).toBe(true);
      expect(union.contains(3)).toBe(true);
      expect(union.contains(4)).toBe(true);
      expect(union.contains(5)).toBe(true);
    });

    test('union does not modify original sets', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([3, 4, 5]);
      set1.union(set2);

      expect(set1.size).toBe(3);
      expect(set2.size).toBe(3);
    });

    test('intersection finds common elements', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([2, 3, 4]);
      const intersection = set1.intersection(set2);

      expect(intersection.size).toBe(2);
      expect(intersection.contains(2)).toBe(true);
      expect(intersection.contains(3)).toBe(true);
      expect(intersection.contains(1)).toBe(false);
      expect(intersection.contains(4)).toBe(false);
    });

    test('intersection with no common elements', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([4, 5, 6]);
      const intersection = set1.intersection(set2);

      expect(intersection.size).toBe(0);
      expect(intersection.isEmpty()).toBe(true);
    });

    test('difference finds elements in first but not second', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([2, 3, 4]);
      const diff = set1.difference(set2);

      expect(diff.size).toBe(1);
      expect(diff.contains(1)).toBe(true);
      expect(diff.contains(2)).toBe(false);
      expect(diff.contains(3)).toBe(false);
    });

    test('difference with no overlap', () => {
      const set1 = CborSet.fromArray([1, 2, 3]);
      const set2 = CborSet.fromArray([4, 5, 6]);
      const diff = set1.difference(set2);

      expect(diff.size).toBe(3);
      expect(diff.contains(1)).toBe(true);
      expect(diff.contains(2)).toBe(true);
      expect(diff.contains(3)).toBe(true);
    });

    test('isSubsetOf checks subset relationship', () => {
      const small = CborSet.fromArray([1, 2]);
      const large = CborSet.fromArray([1, 2, 3, 4]);
      const other = CborSet.fromArray([5, 6]);

      expect(small.isSubsetOf(large)).toBe(true);
      expect(large.isSubsetOf(small)).toBe(false);
      expect(small.isSubsetOf(other)).toBe(false);
    });

    test('empty set is subset of any set', () => {
      const empty = new CborSet();
      const set = CborSet.fromArray([1, 2, 3]);

      expect(empty.isSubsetOf(set)).toBe(true);
    });

    test('set is subset of itself', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      expect(set.isSubsetOf(set)).toBe(true);
    });

    test('isSupersetOf checks superset relationship', () => {
      const large = CborSet.fromArray([1, 2, 3, 4]);
      const small = CborSet.fromArray([1, 2]);

      expect(large.isSupersetOf(small)).toBe(true);
      expect(small.isSupersetOf(large)).toBe(false);
    });

    test('any set is superset of empty set', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const empty = new CborSet();

      expect(set.isSupersetOf(empty)).toBe(true);
    });
  });

  describe('CBOR Encoding', () => {
    test('encodes as array', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const untagged = set.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Array);
      if (untagged.type === MajorType.Array) {
        expect(untagged.value.length).toBe(3);
      }
    });

    test('tagged encoding includes tag(258)', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const tagged = set.taggedCbor();

      expect(tagged.type).toBe(MajorType.Tagged);
      expect(getTagValue(tagged)).toBe(TAG_SET);
    });

    test('tagged encoding preserves values', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const tagged = set.taggedCbor();

      if (tagged.type === MajorType.Tagged) {
        const content = tagged.value;
        expect(content.type).toBe(MajorType.Array);
      }
    });

    test('empty set encodes as empty array', () => {
      const set = new CborSet();
      const untagged = set.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Array);
      if (untagged.type === MajorType.Array) {
        expect(untagged.value.length).toBe(0);
      }
    });
  });

  describe('CBOR Decoding', () => {
    test('decodes from untagged CBOR', () => {
      const original = CborSet.fromArray([1, 2, 3]);
      const untagged = original.untaggedCbor();
      const decoded = new CborSet().fromUntaggedCbor(untagged);

      expect(decoded.size).toBe(3);
      expect(decoded.contains(1)).toBe(true);
      expect(decoded.contains(2)).toBe(true);
      expect(decoded.contains(3)).toBe(true);
    });

    test('decodes from tagged CBOR', () => {
      const original = CborSet.fromArray([1, 2, 3]);
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      expect(decoded.size).toBe(3);
      expect(decoded.contains(1)).toBe(true);
    });

    test('throws on invalid CBOR type', () => {
      const invalidCbor = { isCbor: true as const, type: MajorType.Text, value: 'not-an-array' };

      expect(() => {
        new CborSet().fromUntaggedCbor(invalidCbor as any);
      }).toThrow('Expected array for set encoding');
    });

    test('throws on invalid tagged CBOR', () => {
      const wrongTag = {
        isCbor: true as const,
        type: MajorType.Tagged,
        tag: 999,
        value: { isCbor: true as const, type: MajorType.Array, value: [] }
      };

      expect(() => {
        new CborSet().fromTaggedCbor(wrongTag as any);
      }).toThrow('Expected tag 258, got 999');
    });
  });

  describe('Round-Trip Encoding/Decoding', () => {
    test('round-trip with integers', () => {
      const original = CborSet.fromArray([1, 2, 3, 4, 5]);
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      expect(decoded.size).toBe(original.size);
      expect(decoded.toArray()).toEqual(original.toArray());
    });

    test('round-trip with strings', () => {
      const original = CborSet.fromArray(['apple', 'banana', 'cherry']);
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      expect(decoded.size).toBe(3);
      expect(decoded.contains('apple')).toBe(true);
      expect(decoded.contains('banana')).toBe(true);
      expect(decoded.contains('cherry')).toBe(true);
    });

    test('round-trip with mixed types', () => {
      const original = CborSet.fromArray([1, 'hello', true, null]);
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      expect(decoded.size).toBe(4);
      expect(decoded.contains(1)).toBe(true);
      expect(decoded.contains('hello')).toBe(true);
      expect(decoded.contains(true)).toBe(true);
      expect(decoded.contains(null)).toBe(true);
    });

    test('round-trip with empty set', () => {
      const original = new CborSet();
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      expect(decoded.size).toBe(0);
      expect(decoded.isEmpty()).toBe(true);
    });

    test('round-trip preserves deterministic ordering', () => {
      // Insert in random order
      const original = CborSet.fromArray([3, 1, 4, 1, 5, 9, 2, 6]);
      const tagged = original.taggedCbor();
      const decoded = CborSet.fromTaggedCborStatic(tagged);

      // Order should be deterministic (by CBOR encoding)
      expect(decoded.toArray()).toEqual(original.toArray());
    });
  });

  describe('Iteration', () => {
    test('iterates over elements', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const values: number[] = [];

      for (const value of set) {
        values.push(extractCbor(value) as number);
      }

      expect(values).toHaveLength(3);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });

    test('values returns array', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const values = set.values();

      expect(values).toHaveLength(3);
      expect(values[0].isCbor).toBe(true);
    });

    test('forEach executes callback', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const collected: number[] = [];

      set.forEach(value => {
        collected.push(extractCbor(value) as number);
      });

      expect(collected).toHaveLength(3);
      expect(collected).toContain(1);
      expect(collected).toContain(2);
      expect(collected).toContain(3);
    });

    test('iteration over empty set', () => {
      const set = new CborSet();
      const values: any[] = [];

      for (const value of set) {
        values.push(value);
      }

      expect(values).toHaveLength(0);
    });
  });

  describe('Conversion', () => {
    test('toSet converts to JavaScript Set', () => {
      const cborSet = CborSet.fromArray([1, 2, 3]);
      const jsSet = cborSet.toSet();

      expect(jsSet).toBeInstanceOf(Set);
      expect(jsSet.size).toBe(3);
      expect(jsSet.has(1)).toBe(true);
      expect(jsSet.has(2)).toBe(true);
      expect(jsSet.has(3)).toBe(true);
    });

    test('toArray converts to array', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const array = set.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array).toHaveLength(3);
      expect(array).toContain(1);
      expect(array).toContain(2);
      expect(array).toContain(3);
    });

    test('toBytes converts to CBOR bytes', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const bytes = set.toBytes();

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    test('toCbor returns untagged CBOR', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const cbor = set.toCbor();

      expect(cbor.type).toBe(MajorType.Array);
    });
  });

  describe('Display and Formatting', () => {
    test('diagnostic shows elements', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const diagnostic = set.diagnostic;

      expect(diagnostic).toContain('1');
      expect(diagnostic).toContain('2');
      expect(diagnostic).toContain('3');
    });

    test('diagnostic formats strings with quotes', () => {
      const set = CborSet.fromArray(['hello', 'world']);
      const diagnostic = set.diagnostic;

      expect(diagnostic).toContain('"hello"');
      expect(diagnostic).toContain('"world"');
    });

    test('toString returns diagnostic', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const str = set.toString();

      expect(str).toBe(set.diagnostic);
    });

    test('toJSON returns array', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const json = set.toJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(3);
    });

    test('empty set diagnostic', () => {
      const set = new CborSet();
      const diagnostic = set.diagnostic;

      expect(diagnostic).toBe('[]');
    });
  });

  describe('Deterministic Ordering', () => {
    test('maintains deterministic order regardless of insertion order', () => {
      const set1 = CborSet.fromArray([3, 1, 2]);
      const set2 = CborSet.fromArray([2, 3, 1]);
      const set3 = CborSet.fromArray([1, 2, 3]);

      const array1 = set1.toArray();
      const array2 = set2.toArray();
      const array3 = set3.toArray();

      expect(array1).toEqual(array2);
      expect(array2).toEqual(array3);
    });

    test('deterministic ordering with strings', () => {
      const set1 = CborSet.fromArray(['zebra', 'apple', 'banana']);
      const set2 = CborSet.fromArray(['apple', 'zebra', 'banana']);

      const array1 = set1.toArray();
      const array2 = set2.toArray();

      expect(array1).toEqual(array2);
    });
  });

  describe('Edge Cases', () => {
    test('handles large sets', () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const set = CborSet.fromArray(items);

      expect(set.size).toBe(1000);
      expect(set.contains(500)).toBe(true);
      expect(set.contains(1001)).toBe(false);
    });

    test('handles nested arrays as elements', () => {
      const set = CborSet.fromArray([[1, 2], [3, 4]]);
      expect(set.size).toBe(2);
    });

    test('handles objects as elements', () => {
      const set = CborSet.fromArray([{ a: 1 }, { b: 2 }]);
      expect(set.size).toBe(2);
    });

    test('deleting from empty set', () => {
      const set = new CborSet();
      const result = set.delete(42);

      expect(result).toBe(false);
      expect(set.size).toBe(0);
    });

    test('multiple operations in sequence', () => {
      const set = new CborSet();
      set.insert(1);
      set.insert(2);
      set.insert(3);
      set.delete(2);
      set.insert(4);
      set.insert(2); // Re-insert

      expect(set.size).toBe(4);
      expect(set.contains(1)).toBe(true);
      expect(set.contains(2)).toBe(true);
      expect(set.contains(3)).toBe(true);
      expect(set.contains(4)).toBe(true);
    });

    test('set operations with empty sets', () => {
      const empty = new CborSet();
      const set = CborSet.fromArray([1, 2, 3]);

      const union = empty.union(set);
      const intersection = empty.intersection(set);
      const difference = empty.difference(set);

      expect(union.size).toBe(3);
      expect(intersection.size).toBe(0);
      expect(difference.size).toBe(0);
    });

    test('set operations with itself', () => {
      const set = CborSet.fromArray([1, 2, 3]);

      const union = set.union(set);
      const intersection = set.intersection(set);
      const difference = set.difference(set);

      expect(union.size).toBe(3);
      expect(intersection.size).toBe(3);
      expect(difference.size).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('set can be used in another set', () => {
      const innerSet = CborSet.fromArray([1, 2, 3]);
      const outerSet = new CborSet();
      outerSet.insert(innerSet);

      expect(outerSet.size).toBe(1);
    });

    test('complex set operations', () => {
      const set1 = CborSet.fromArray([1, 2, 3, 4, 5]);
      const set2 = CborSet.fromArray([4, 5, 6, 7, 8]);
      const set3 = CborSet.fromArray([1, 3, 5, 7, 9]);

      // (set1 ∪ set2) ∩ set3
      // set1 ∪ set2 = [1, 2, 3, 4, 5, 6, 7, 8]
      // intersection with set3 = [1, 3, 5, 7] (9 is only in set3, not in the union)
      const result = set1.union(set2).intersection(set3);

      expect(result.contains(1)).toBe(true);
      expect(result.contains(3)).toBe(true);
      expect(result.contains(5)).toBe(true);
      expect(result.contains(7)).toBe(true);
      expect(result.contains(9)).toBe(false); // 9 is not in the union
      expect(result.size).toBe(4);
    });

    test('encoding and decoding preserves set operations', () => {
      const original1 = CborSet.fromArray([1, 2, 3]);
      const original2 = CborSet.fromArray([2, 3, 4]);

      // Encode, decode, then perform operations
      const decoded1 = CborSet.fromTaggedCborStatic(original1.taggedCbor());
      const decoded2 = CborSet.fromTaggedCborStatic(original2.taggedCbor());

      const intersection = decoded1.intersection(decoded2);
      expect(intersection.size).toBe(2);
      expect(intersection.contains(2)).toBe(true);
      expect(intersection.contains(3)).toBe(true);
    });
  });
});
