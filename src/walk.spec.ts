/**
 * Tests for the CBOR tree traversal (walk) module.
 * Ported and adapted from bc-dcbor-rust/tests/walk.rs
 */

import { cbor } from './encode';
import { CborMap } from './map';
import { MajorType } from './cbor';
import {
  walk,
  countElements,
  collectAtLevel,
  findFirst,
  collectAllText,
  maxDepth,
  EdgeType,
  WalkElement,
  EdgeTypeVariant,
  asSingle,
  asKeyValue,
  edgeLabel
} from './walk';

describe('Walk Module Tests', () => {
  describe('Basic Functionality', () => {
    test('counts elements in simple array', () => {
      const array = cbor([1, 2, 3]);
      const count = countElements(array);
      expect(count).toBe(4); // root array + 3 elements
    });

    test('counts elements in nested array', () => {
      const nested = cbor([1, [2, 3], 4]);
      const count = countElements(nested);
      expect(count).toBe(6); // root array + 1 + inner array + 2 + 3 + 4
    });

    test('counts elements in simple map', () => {
      const map = new CborMap();
      map.set(cbor('a'), cbor(1));
      map.set(cbor('b'), cbor(2));
      const mapCbor = cbor(map);

      const count = countElements(mapCbor);
      // root map + 2 kv pairs + 4 individual keys/values = 7
      expect(count).toBe(7);
    });

    test('counts elements in tagged value', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: cbor(1234567890)
      });

      const count = countElements(tagged);
      expect(count).toBe(2); // tagged value + content
    });

    test('counts single leaf value', () => {
      const leaf = cbor(42);
      const count = countElements(leaf);
      expect(count).toBe(1);
    });
  });

  describe('State Threading', () => {
    test('threads state through traversal', () => {
      const array = cbor([1, 2, 3, 4, 5]);

      interface State {
        evenCount: number;
      }

      const finalState = walk<State>(
        array,
        { evenCount: 0 },
        (element, level, edge, state) => {
          if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
            const n = element.cbor.value as number;
            if (n % 2 === 0) {
              return [{ evenCount: state.evenCount + 1 }, false];
            }
          }
          return [state, false];
        }
      );

      expect(finalState.evenCount).toBe(2); // 2 and 4
    });

    test('accumulates sum with state', () => {
      const array = cbor([10, 20, 30]);

      interface SumState {
        sum: number;
      }

      const result = walk<SumState>(
        array,
        { sum: 0 },
        (element, level, edge, state) => {
          if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
            return [{ sum: state.sum + (element.cbor.value as number) }, false];
          }
          return [state, false];
        }
      );

      expect(result.sum).toBe(60);
    });

    test('collects items in state', () => {
      const structure = cbor({
        numbers: [1, 2, 3],
        strings: ['a', 'b', 'c']
      });

      interface CollectState {
        numbers: number[];
        strings: string[];
      }

      const result = walk<CollectState>(
        structure,
        { numbers: [], strings: [] },
        (element, level, edge, state) => {
          if (element.type === 'single') {
            if (element.cbor.type === MajorType.Unsigned) {
              return [
                {
                  ...state,
                  numbers: [...state.numbers, element.cbor.value as number]
                },
                false
              ];
            } else if (element.cbor.type === MajorType.Text) {
              return [
                {
                  ...state,
                  strings: [...state.strings, element.cbor.value]
                },
                false
              ];
            }
          }
          return [state, false];
        }
      );

      expect(result.numbers).toEqual([1, 2, 3]);
      expect(result.strings).toEqual(['numbers', 'strings', 'a', 'b', 'c']);
    });
  });

  describe('Stop Flag Behavior', () => {
    test('stop flag prevents descent into children', () => {
      const nested = cbor([
        [1, 2, 3],
        'marker',
        [4, 5, 6]
      ]);

      interface VisitState {
        visited: string[];
        foundMarker: boolean;
        stopNext: boolean;
      }

      const result = walk<VisitState>(
        nested,
        { visited: [], foundMarker: false, stopNext: false },
        (element, level, edge, state) => {
          const desc = `L${level}:${element.type}`;
          const newVisited = [...state.visited, desc];

          let foundMarker = state.foundMarker;
          let stopNext = state.stopNext;

          if (element.type === 'single' &&
              element.cbor.type === MajorType.Text &&
              element.cbor.value === 'marker') {
            foundMarker = true;
            stopNext = true; // Set flag to stop at next array
          }

          // Stop descent for last array (when stopNext is set)
          const stop = stopNext &&
                      element.type === 'single' &&
                      element.cbor.type === MajorType.Array;

          return [{ visited: newVisited, foundMarker, stopNext: stop ? false : stopNext }, stop];
        }
      );

      expect(result.foundMarker).toBe(true);
      // Should visit the [4,5,6] array at level 1 but not its children at level 2
      // Count visits at each level
      const level1Count = result.visited.filter(v => v.startsWith('L1:')).length;
      const level2Count = result.visited.filter(v => v.startsWith('L2:')).length;

      // Should have level 1 visits (first array children, marker, third array)
      expect(level1Count).toBeGreaterThan(0);
      // Should have fewer level 2 visits (only from first array, not third)
      expect(level2Count).toBe(3); // Only 1, 2, 3 from first array
    });

    test('stop flag prevents descending into nested containers', () => {
      // Stop flag means "don't descend into this element's children"
      // not "stop the entire traversal"
      const structure = cbor([
        [1, 2, 3],           // Should visit this array but not its children
        [4, 5, 6],           // Should visit normally
        { nested: [7, 8, 9] } // Should visit normally
      ]);

      interface StopState {
        numbersFound: number[];
        firstArraySeen: boolean;
      }

      const result = walk<StopState>(
        structure,
        { numbersFound: [], firstArraySeen: false },
        (element, level, edge, state) => {
          // Stop descent for the first array we encounter
          if (element.type === 'single' &&
              element.cbor.type === MajorType.Array &&
              !state.firstArraySeen &&
              level === 1) {
            return [{ ...state, firstArraySeen: true }, true];
          }

          // Collect numbers
          if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
            return [{
              ...state,
              numbersFound: [...state.numbersFound, element.cbor.value as number]
            }, false];
          }

          return [state, false];
        }
      );

      expect(result.firstArraySeen).toBe(true);
      // Should NOT find 1, 2, 3 (stopped at first array)
      // SHOULD find 4, 5, 6 and 7, 8, 9 (other arrays traversed normally)
      expect(result.numbersFound).not.toContain(1);
      expect(result.numbersFound).not.toContain(2);
      expect(result.numbersFound).not.toContain(3);
      expect(result.numbersFound).toContain(4);
      expect(result.numbersFound).toContain(5);
      expect(result.numbersFound).toContain(6);
      expect(result.numbersFound).toContain(7);
      expect(result.numbersFound).toContain(8);
      expect(result.numbersFound).toContain(9);
    });
  });

  describe('Edge Types', () => {
    test('identifies array element edges', () => {
      const array = cbor(['a', 'b', 'c']);

      interface EdgeState {
        edges: EdgeTypeVariant[];
      }

      const result = walk<EdgeState>(
        array,
        { edges: [] },
        (element, level, edge, state) => {
          return [{ edges: [...state.edges, edge] }, false];
        }
      );

      expect(result.edges.length).toBe(4); // root + 3 elements
      expect(result.edges[0].type).toBe(EdgeType.None);
      expect(result.edges[1].type).toBe(EdgeType.ArrayElement);
      expect(result.edges[2].type).toBe(EdgeType.ArrayElement);
      expect(result.edges[3].type).toBe(EdgeType.ArrayElement);

      if (result.edges[1].type === EdgeType.ArrayElement) {
        expect(result.edges[1].index).toBe(0);
      }
      if (result.edges[2].type === EdgeType.ArrayElement) {
        expect(result.edges[2].index).toBe(1);
      }
      if (result.edges[3].type === EdgeType.ArrayElement) {
        expect(result.edges[3].index).toBe(2);
      }
    });

    test('identifies map edges', () => {
      const map = new CborMap();
      map.set(cbor('key'), cbor('value'));
      const mapCbor = cbor(map);

      interface EdgeState {
        edges: EdgeTypeVariant[];
      }

      const result = walk<EdgeState>(
        mapCbor,
        { edges: [] },
        (element, level, edge, state) => {
          return [{ edges: [...state.edges, edge] }, false];
        }
      );

      const edgeTypes = result.edges.map(e => e.type);
      expect(edgeTypes).toContain(EdgeType.None);
      expect(edgeTypes).toContain(EdgeType.MapKeyValue);
      expect(edgeTypes).toContain(EdgeType.MapKey);
      expect(edgeTypes).toContain(EdgeType.MapValue);
    });

    test('identifies tagged content edge', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: cbor(12345)
      });

      interface EdgeState {
        edges: EdgeTypeVariant[];
      }

      const result = walk<EdgeState>(
        tagged,
        { edges: [] },
        (element, level, edge, state) => {
          return [{ edges: [...state.edges, edge] }, false];
        }
      );

      expect(result.edges.length).toBe(2);
      expect(result.edges[0].type).toBe(EdgeType.None);
      expect(result.edges[1].type).toBe(EdgeType.TaggedContent);
    });
  });

  describe('Real-World Use Cases', () => {
    test('extracts all text from document structure', () => {
      const doc = cbor({
        title: 'Document',
        sections: [
          { heading: 'Section 1', content: 'Text 1' },
          { heading: 'Section 2', content: 'Text 2' }
        ],
        metadata: {
          author: 'John Doe',
          tags: ['typescript', 'cbor']
        }
      });

      const texts = collectAllText(doc);

      expect(texts).toContain('Document');
      expect(texts).toContain('Section 1');
      expect(texts).toContain('Text 1');
      expect(texts).toContain('Section 2');
      expect(texts).toContain('Text 2');
      expect(texts).toContain('John Doe');
      expect(texts).toContain('typescript');
      expect(texts).toContain('cbor');
    });

    test('finds specific value in nested structure', () => {
      const structure = cbor({
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
          { name: 'Charlie', age: 35 }
        ]
      });

      const bob = findFirst(structure, (element) => {
        if (element.type === 'single' &&
            element.cbor.type === MajorType.Text &&
            element.cbor.value === 'Bob') {
          return true;
        }
        return false;
      });

      expect(bob).toBeDefined();
      expect(bob?.type).toBe(MajorType.Text);
      if (bob?.type === MajorType.Text) {
        expect(bob.value).toBe('Bob');
      }
    });

    test('validates schema by checking required fields', () => {
      const data = cbor({
        id: 123,
        name: 'Test',
        email: 'test@example.com'
      });

      const requiredFields = ['id', 'name', 'email'];
      const foundFields = new Set<string>();

      walk(data, null, (element, level, edge) => {
        if (edge.type === EdgeType.MapKey &&
            element.type === 'single' &&
            element.cbor.type === MajorType.Text) {
          foundFields.add(element.cbor.value);
        }
        return [null, false];
      });

      requiredFields.forEach(field => {
        expect(foundFields.has(field)).toBe(true);
      });
    });

    test('computes statistics on numeric data', () => {
      const data = cbor({
        measurements: [10, 20, 30, 40, 50],
        metadata: { unit: 'celsius' }
      });

      interface StatsState {
        sum: number;
        count: number;
        min: number;
        max: number;
      }

      const result = walk<StatsState>(
        data,
        { sum: 0, count: 0, min: Infinity, max: -Infinity },
        (element, level, edge, state) => {
          if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
            const n = element.cbor.value as number;
            return [{
              sum: state.sum + n,
              count: state.count + 1,
              min: Math.min(state.min, n),
              max: Math.max(state.max, n)
            }, false];
          }
          return [state, false];
        }
      );

      expect(result.sum).toBe(150);
      expect(result.count).toBe(5);
      expect(result.min).toBe(10);
      expect(result.max).toBe(50);
      expect(result.sum / result.count).toBe(30); // average
    });
  });

  describe('Helper Functions', () => {
    test('collectAtLevel extracts elements at specific depth', () => {
      const structure = cbor([[1, 2], [3, 4]]);

      const level0 = collectAtLevel(structure, 0);
      expect(level0.length).toBe(1); // root array

      const level1 = collectAtLevel(structure, 1);
      expect(level1.length).toBe(2); // two inner arrays

      const level2 = collectAtLevel(structure, 2);
      expect(level2.length).toBe(4); // four numbers
    });

    test('maxDepth calculates tree depth', () => {
      const flat = cbor([1, 2, 3]);
      expect(maxDepth(flat)).toBe(1);

      const nested1 = cbor([[1, 2]]);
      expect(maxDepth(nested1)).toBe(2);

      const nested2 = cbor([[[1]]]);
      expect(maxDepth(nested2)).toBe(3);

      const complex = cbor({
        level1: {
          level2: {
            level3: [1, 2, 3]
          }
        }
      });
      // Map keys/values add levels
      expect(maxDepth(complex)).toBeGreaterThanOrEqual(3);
    });

    test('collectAllText handles empty structures', () => {
      const empty = cbor([]);
      const texts = collectAllText(empty);
      expect(texts).toEqual([]);
    });

    test('findFirst returns undefined when not found', () => {
      const structure = cbor([1, 2, 3]);
      const result = findFirst(structure, (element) => {
        return element.type === 'single' &&
               element.cbor.type === MajorType.Text &&
               element.cbor.value === 'not there';
      });
      expect(result).toBeUndefined();
    });
  });

  describe('Map Key-Value Handling', () => {
    test('visits map entries as key-value pairs', () => {
      const map = new CborMap();
      map.set(cbor('key1'), cbor('value1'));
      map.set(cbor('key2'), cbor('value2'));
      const mapCbor = cbor(map);

      interface KVState {
        keyValuePairs: number;
        individualKeys: number;
        individualValues: number;
      }

      const result = walk<KVState>(
        mapCbor,
        { keyValuePairs: 0, individualKeys: 0, individualValues: 0 },
        (element, level, edge, state) => {
          if (element.type === 'keyvalue') {
            return [{
              ...state,
              keyValuePairs: state.keyValuePairs + 1
            }, false];
          } else if (edge.type === EdgeType.MapKey) {
            return [{
              ...state,
              individualKeys: state.individualKeys + 1
            }, false];
          } else if (edge.type === EdgeType.MapValue) {
            return [{
              ...state,
              individualValues: state.individualValues + 1
            }, false];
          }
          return [state, false];
        }
      );

      expect(result.keyValuePairs).toBe(2);
      expect(result.individualKeys).toBe(2);
      expect(result.individualValues).toBe(2);
    });

    test('can stop descent at key-value level', () => {
      const map = new CborMap();
      map.set(cbor('stop'), cbor([1, 2, 3])); // Should not visit 1, 2, 3
      map.set(cbor('continue'), cbor([4, 5, 6])); // Should visit 4, 5, 6
      const mapCbor = cbor(map);

      interface StopKVState {
        visited: number[];
      }

      const result = walk<StopKVState>(
        mapCbor,
        { visited: [] },
        (element, level, edge, state) => {
          if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
            return [{
              visited: [...state.visited, element.cbor.value as number]
            }, false];
          }

          // Stop descent if we see key "stop"
          if (element.type === 'keyvalue' &&
              element.key.type === MajorType.Text &&
              element.key.value === 'stop') {
            return [state, true];
          }

          return [state, false];
        }
      );

      // Should only see numbers from "continue" entry
      expect(result.visited).toEqual([4, 5, 6]);
    });
  });

  describe('Complex Nested Structures', () => {
    test('handles deeply nested arrays', () => {
      const deep = cbor([[[[[1]]]]]);
      const depth = maxDepth(deep);
      expect(depth).toBe(5);
    });

    test('handles mixed nesting', () => {
      const mixed = cbor({
        array: [1, 2, { nested: [3, 4] }],
        map: {
          inner: {
            value: 5
          }
        }
      });

      const allNumbers: number[] = [];
      walk(mixed, null, (element, level, edge) => {
        if (element.type === 'single' && element.cbor.type === MajorType.Unsigned) {
          allNumbers.push(element.cbor.value as number);
        }
        return [null, false];
      });

      expect(allNumbers.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    test('handles array of maps', () => {
      const data = cbor([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ]);

      const names: string[] = [];
      walk(data, null, (element, level, edge) => {
        if (edge.type === EdgeType.MapValue &&
            element.type === 'single' &&
            element.cbor.type === MajorType.Text) {
          names.push(element.cbor.value);
        }
        return [null, false];
      });

      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      expect(names).toContain('Charlie');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty array', () => {
      const empty = cbor([]);
      const count = countElements(empty);
      expect(count).toBe(1); // just the array itself
    });

    test('handles empty map', () => {
      const empty = cbor(new CborMap());
      const count = countElements(empty);
      expect(count).toBe(1); // just the map itself
    });

    test('handles single value', () => {
      const single = cbor(42);
      const count = countElements(single);
      expect(count).toBe(1);
    });

    test('handles null, true, false', () => {
      const values = cbor([null, true, false]);
      const count = countElements(values);
      expect(count).toBe(4); // array + 3 simple values
    });

    test('handles nested tagged values', () => {
      const inner = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 2,
        value: cbor(999)
      });

      const outer = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: inner
      });

      const count = countElements(outer);
      expect(count).toBe(3); // outer tag + inner tag + value
    });
  });

  describe('Helper Functions', () => {
    describe('asSingle', () => {
      test('extracts CBOR from single element', () => {
        const element: WalkElement = {
          type: 'single',
          cbor: cbor(42)
        };
        const result = asSingle(element);
        expect(result).toBeDefined();
        expect(result?.type).toBe(MajorType.Unsigned);
        expect((result as any)?.value).toBe(42);
      });

      test('returns undefined for keyvalue element', () => {
        const element: WalkElement = {
          type: 'keyvalue',
          key: cbor('key'),
          value: cbor('value')
        };
        const result = asSingle(element);
        expect(result).toBeUndefined();
      });
    });

    describe('asKeyValue', () => {
      test('extracts key-value pair from keyvalue element', () => {
        const keyVal = cbor('mykey');
        const valueVal = cbor(123);
        const element: WalkElement = {
          type: 'keyvalue',
          key: keyVal,
          value: valueVal
        };
        const result = asKeyValue(element);
        expect(result).toBeDefined();
        expect(result![0]).toBe(keyVal);
        expect(result![1]).toBe(valueVal);
      });

      test('returns undefined for single element', () => {
        const element: WalkElement = {
          type: 'single',
          cbor: cbor(42)
        };
        const result = asKeyValue(element);
        expect(result).toBeUndefined();
      });
    });

    describe('edgeLabel', () => {
      test('returns undefined for None edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.None };
        expect(edgeLabel(edge)).toBeUndefined();
      });

      test('returns "arr[index]" for ArrayElement edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.ArrayElement, index: 5 };
        expect(edgeLabel(edge)).toBe('arr[5]');
      });

      test('returns "kv" for MapKeyValue edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.MapKeyValue };
        expect(edgeLabel(edge)).toBe('kv');
      });

      test('returns "key" for MapKey edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.MapKey };
        expect(edgeLabel(edge)).toBe('key');
      });

      test('returns "val" for MapValue edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.MapValue };
        expect(edgeLabel(edge)).toBe('val');
      });

      test('returns "content" for TaggedContent edge', () => {
        const edge: EdgeTypeVariant = { type: EdgeType.TaggedContent };
        expect(edgeLabel(edge)).toBe('content');
      });
    });

    describe('Integration with walk', () => {
      test('asSingle and asKeyValue work in visitor', () => {
        const map = new CborMap();
        map.set(cbor('name'), cbor('Alice'));
        map.set(cbor('age'), cbor(30));
        const data = cbor(map);

        let kvPairs = 0;
        let singles = 0;

        walk(data, null, (element) => {
          if (asSingle(element)) {
            singles++;
          }
          if (asKeyValue(element)) {
            kvPairs++;
          }
          return [null, false];
        });

        expect(kvPairs).toBe(2); // Two key-value pairs
        expect(singles).toBeGreaterThan(0); // Map itself, keys, and values
      });

      test('edgeLabel works with walk edges', () => {
        const data = cbor([1, 2, 3]);
        const labels: (string | undefined)[] = [];

        walk(data, null, (element, level, edge) => {
          labels.push(edgeLabel(edge));
          return [null, false];
        });

        expect(labels).toContain(undefined); // Root element (None)
        expect(labels).toContain('arr[0]');
        expect(labels).toContain('arr[1]');
        expect(labels).toContain('arr[2]');
      });
    });
  });
});
