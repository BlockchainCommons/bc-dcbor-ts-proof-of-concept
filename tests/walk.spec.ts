// Translation of bc-dcbor-rust/tests/walk.rs
// Tests CBOR tree traversal functionality

import { describe, test, expect } from '@jest/globals';
import { cbor } from '../src/encode';
import { Cbor, MajorType } from '../src/cbor';
import { CborMap } from '../src/map';
import { walk, WalkElement, EdgeType, EdgeTypeVariant } from '../src/walk';

// Helper function to count visits
function countVisits(cborValue: Cbor): number {
  let count = 0;
  walk(cborValue, null, (element, level, edge, state) => {
    count++;
    return [state, false];
  });
  return count;
}

describe('Walk Tests', () => {
  describe('test_traversal_counts', () => {
    test('simple array', () => {
      const array = cbor([1, 2, 3]);
      const count = countVisits(array);
      // Root + 3 array elements = 4
      expect(count).toBe(4);
    });

    test('simple map', () => {
      const map = new CborMap();
      map.set('a', 1);
      map.set('b', 2);
      const mapCbor = cbor(map);
      const count = countVisits(mapCbor);
      // Root + 2 key-value pairs + 4 individual keys/values = 7
      expect(count).toBe(7);
    });

    test('tagged value', () => {
      const tagged: Cbor = { isCbor: true, type: MajorType.Tagged, tag: 42n, value: cbor(100) };
      const count = countVisits(tagged);
      // Root tagged value + content = 2
      expect(count).toBe(2);
    });

    test('nested structure', () => {
      const innerMap = new CborMap();
      innerMap.set('x', [1, 2]);
      const outerMap = new CborMap();
      outerMap.set('inner', innerMap);
      outerMap.set('simple', 42);
      const nested = cbor(outerMap);
      const count = countVisits(nested);
      // Should visit:
      // 1. root map
      // 2-3. 2 kv pairs in outer (inner and simple)
      // 4-5. 2 individual keys in outer (inner, simple)
      // 6. inner map value
      // 7. 1 kv pair in inner map (x)
      // 8-9. 2 individual key/value in inner (x key, array value)
      // 10-11. 2 array elements (1, 2)
      // 12. simple value (42)
      // = 12 total
      expect(count).toBe(12);
    });
  });

  describe('test_visitor_state_threading', () => {
    test('count even numbers', () => {
      const array = cbor([1, 2, 3, 4, 5]);

      let evenCount = 0;
      walk(array, null, (element, level, edge, state) => {
        if (element.type === 'single') {
          const cborVal = element.cbor;
          if (cborVal.type === MajorType.Unsigned && typeof cborVal.value === 'number') {
            if (cborVal.value % 2 === 0) {
              evenCount++;
            }
          }
        }
        return [state, false];
      });

      expect(evenCount).toBe(2); // 2 and 4 are even
    });
  });

  describe('test_early_termination', () => {
    test('stop flag prevents descent', () => {
      // Create nested structure: [[1, 2], [3, 4], [5, 6]]
      const nestedStructure = cbor([[1, 2], [3, 4], [5, 6]]);

      const visited: string[] = [];
      walk(nestedStructure, null, (element, level, edge, state) => {
        if (element.type === 'single') {
          const val = element.cbor;

          // Record what we visited
          if (val.type === MajorType.Array) {
            visited.push('array');
          } else if (val.type === MajorType.Unsigned) {
            visited.push(`num:${val.value}`);
          }

          // Stop descent into first sub-array
          if (val.type === MajorType.Array && level === 1) {
            const arrayVal = val.value as Cbor[];
            if (arrayVal.length > 0) {
              const firstElem = arrayVal[0];
              if (firstElem.type === MajorType.Unsigned && firstElem.value === 1) {
                return [state, true]; // Don't descend into [1, 2]
              }
            }
          }
        }
        return [state, false];
      });

      // Should visit:
      // - root array
      // - first sub-array [1,2] but NOT descend (stop=true)
      // - second sub-array [3,4] AND descend
      // - 3, 4
      // - third sub-array [5,6] AND descend
      // - 5, 6
      expect(visited).toContain('array'); // root
      expect(visited).toContain('num:3');
      expect(visited).toContain('num:4');
      expect(visited).toContain('num:5');
      expect(visited).toContain('num:6');
      expect(visited).not.toContain('num:1'); // Stopped descent
      expect(visited).not.toContain('num:2'); // Stopped descent
    });
  });

  describe('test_depth_limited_traversal', () => {
    test('limit traversal by depth', () => {
      // Create nested structure: [[1, 2], [3, 4]]
      const nested = cbor([[1, 2], [3, 4]]);

      // Only visit elements at level <= 1
      const visitedLevels: number[] = [];
      walk(nested, null, (element, level, edge, state) => {
        visitedLevels.push(level);
        // Stop if we would descend past level 1
        const stop = level >= 1;
        return [state, stop];
      });

      // Should visit levels: 0 (root), 1 (sub-arrays), but NOT 2 (numbers inside)
      expect(Math.max(...visitedLevels)).toBeLessThanOrEqual(1);
      expect(visitedLevels).toContain(0);
      expect(visitedLevels).toContain(1);
    });
  });

  describe('test_text_extraction', () => {
    test('extract all text strings', () => {
      // Create complex structure with various text strings
      const nestedMap = new CborMap();
      nestedMap.set('title', 'Document');
      const map = new CborMap();
      map.set('name', 'Alice');
      map.set('items', ['apple', 'banana', 'cherry']);
      map.set('nested', nestedMap);
      const structure = cbor(map);

      const texts: string[] = [];
      walk(structure, null, (element, level, edge, state) => {
        if (element.type === 'single') {
          const val = element.cbor;
          if (val.type === MajorType.Text && typeof val.value === 'string') {
            texts.push(val.value);
          }
        }
        return [state, false ];
      });

      expect(texts).toContain('name');
      expect(texts).toContain('Alice');
      expect(texts).toContain('items');
      expect(texts).toContain('apple');
      expect(texts).toContain('banana');
      expect(texts).toContain('cherry');
      expect(texts).toContain('nested');
      expect(texts).toContain('title');
      expect(texts).toContain('Document');
    });
  });

  describe('test_traversal_order_and_edge_types', () => {
    test('verify edge types', () => {
      const array = cbor([1, 2, 3]);
      const edgeTypes: EdgeTypeVariant[] = [];

      walk(array, null, (element, level, edge, state) => {
        edgeTypes.push(edge);
        return [state, false ];
      });

      // First element should have None edge (the root)
      expect(edgeTypes[0].type).toBe(EdgeType.None);
      // Array elements should have ArrayElement edge
      expect(edgeTypes.filter(e => e.type === EdgeType.ArrayElement).length).toBe(3);
    });

    test('map edge types', () => {
      const map = new CborMap();
      map.set('a', 1);
      const mapCbor = cbor(map);
      const edgeTypes: EdgeTypeVariant[] = [];

      walk(mapCbor, null, (element, level, edge, state) => {
        edgeTypes.push(edge);
        return [state, false ];
      });

      // Should see MapKeyValue, MapKey, and MapValue edges
      expect(edgeTypes.some(e => e.type === EdgeType.MapKeyValue)).toBe(true);
      expect(edgeTypes.some(e => e.type === EdgeType.MapKey)).toBe(true);
      expect(edgeTypes.some(e => e.type === EdgeType.MapValue)).toBe(true);
    });
  });

  describe('test_primitive_values', () => {
    test('walk primitive values', () => {
      const primitives = [
        cbor(42),
        cbor(-10),
        cbor('hello'),
        cbor(new Uint8Array([1, 2, 3])),
        cbor(true),
        cbor(false),
        cbor(null)
      ];

      for (const primitive of primitives) {
        const count = countVisits(primitive);
        // Each primitive should have exactly 1 visit (itself)
        expect(count).toBe(1);
      }
    });
  });

  describe('test_empty_structures', () => {
    test('empty array', () => {
      const empty = cbor([]);
      const count = countVisits(empty);
      // Just the root array, no elements
      expect(count).toBe(1);
    });

    test('empty map', () => {
      const empty = cbor(new CborMap());
      const count = countVisits(empty);
      // Just the root map, no key-value pairs
      expect(count).toBe(1);
    });
  });

  describe('test_map_keyvalue_semantics', () => {
    test('visit both keyvalue and individual key/value', () => {
      const map = new CborMap();
      map.set('key1', 'value1');
      const mapCbor = cbor(map);

      let keyValueCount = 0;
      let keyCount = 0;
      let valueCount = 0;

      walk(mapCbor, null, (element, level, edge, state) => {
        if (element.type === 'keyvalue') {
          keyValueCount++;
        }
        if (edge.type === EdgeType.MapKey) {
          keyCount++;
        }
        if (edge.type === EdgeType.MapValue) {
          valueCount++;
        }
        return [state, false ];
      });

      // Should visit:
      // 1 keyvalue element (semantic unit)
      // 1 individual key
      // 1 individual value
      expect(keyValueCount).toBe(1);
      expect(keyCount).toBe(1);
      expect(valueCount).toBe(1);
    });
  });

  describe('test_tagged_value_traversal', () => {
    test('traverse tagged values', () => {
      const tagged: Cbor = { isCbor: true, type: MajorType.Tagged, tag: 100n, value: cbor([1, 2, 3]) };

      let taggedCount = 0;
      let contentCount = 0;

      walk(tagged, null, (element, level, edge, state) => {
        if (element.type === 'single') {
          const val = element.cbor;
          if (val.type === MajorType.Tagged) {
            taggedCount++;
          }
          if (edge.type === EdgeType.TaggedContent) {
            contentCount++;
          }
        }
        return [state, false ];
      });

      expect(taggedCount).toBe(1);
      expect(contentCount).toBeGreaterThan(0);
    });
  });
});
