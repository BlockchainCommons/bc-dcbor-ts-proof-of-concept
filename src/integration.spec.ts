/**
 * Integration tests for CBOR library.
 *
 * Tests real-world scenarios, complex data structures, and
 * interactions between different components.
 */

import { describe, test, expect } from '@jest/globals';
import { Cbor, MajorType } from './cbor';
import { cbor, encodeCbor } from './encode';
import { decodeCbor } from './decode';
import { CborMap } from './map';
import { CborSet } from './set';
import { CborDate } from './date';
import { extractCbor } from './extract';
import { diagnostic, diagnosticAnnotated } from './diag';
import { walk } from './walk';
import { getGlobalTagsStore } from './tags-store';
import * as conv from './conveniences';
import { CBORCodable, defaultToCborData, defaultTryFromCbor } from './codable';

// ============================================================================
// Complex Data Structure Tests
// ============================================================================

describe('Complex Nested Structures', () => {
  test('deeply nested arrays and maps', () => {
    const data = {
      users: [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false },
      ],
      metadata: {
        version: 1,
        timestamp: Date.now(),
      },
    };

    const cborValue = cbor(data);
    const encoded = encodeCbor(cborValue);
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    // Extract to plain object using toMap()
    expect(extracted).toBeInstanceOf(CborMap);
    const map = extracted as CborMap;
    expect(map.get<string, any[]>('users')).toBeDefined();
    expect(map.get<string, CborMap>('metadata')).toBeDefined();
  });

  test('mixed types in array', () => {
    const mixed = [
      42,
      'text',
      true,
      null,
      [1, 2, 3],
      { key: 'value' },
      new Uint8Array([1, 2, 3]),
    ];

    const encoded = encodeCbor(cbor(mixed));
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    expect(Array.isArray(extracted)).toBe(true);
    expect(extracted[0]).toBe(42);
    expect(extracted[1]).toBe('text');
    expect(extracted[2]).toBe(true);
    expect(extracted[3]).toBe(null);
  });

  test('map with various key types', () => {
    const map = new CborMap();
    map.set(1, 'one');
    map.set('two', 2);
    map.set(true, 'boolean key');
    map.set([1, 2], 'array key');

    const encoded = encodeCbor(cbor(map));
    const decoded = decodeCbor(encoded);

    expect(decoded.type).toBe(MajorType.Map);
    const decodedMap = decoded.value as CborMap;
    expect(decodedMap.get<number, string>(1)).toBe('one');
    expect(decodedMap.get<string, number>('two')).toBe(2);
  });
});

// ============================================================================
// Real-World Scenarios
// ============================================================================

describe('User Profile Management', () => {
  class UserProfile implements CBORCodable<UserProfile> {
    constructor(
      public id: number,
      public username: string,
      public email: string,
      public createdAt: CborDate,
      public tags: CborSet,
      public preferences: Map<string, any>
    ) {}

    toCbor(): Cbor {
      const map = new CborMap();
      map.set('id', this.id);
      map.set('username', this.username);
      map.set('email', this.email);
      map.set('createdAt', this.createdAt.taggedCbor());
      map.set('tags', this.tags.taggedCbor());
      map.set('preferences', this.preferences);
      return cbor(map);
    }

    toCborData(): Uint8Array {
      return defaultToCborData(this);
    }

    fromCbor(c: Cbor): UserProfile {
      const map = conv.expectMap(c);
      const id = map.get<string, number>('id')!;
      const username = map.get<string, string>('username')!;
      const email = map.get<string, string>('email')!;

      // Get tagged date
      const entries = map.entries;
      const dateEntry = entries.find(e => extractCbor(e.key) === 'createdAt');
      const createdAt = new CborDate().fromTaggedCbor(dateEntry!.value);

      // Get set - decode from tagged CBOR
      const tagsEntry = entries.find(e => extractCbor(e.key) === 'tags');
      const tags = new CborSet().fromTaggedCbor(tagsEntry!.value);

      const preferences = map.get<string, Map<string, any>>('preferences')!;

      return new UserProfile(id, username, email, createdAt, tags, preferences);
    }

    tryFromCbor(c: Cbor): UserProfile | Error {
      return defaultTryFromCbor(this, c);
    }
  }

  test('create, encode, decode user profile', () => {
    const tags = new CborSet();
    tags.insert('admin');
    tags.insert('verified');

    const prefs = new Map<string, any>([
      ['theme', 'dark'],
      ['notifications', true],
    ]);

    const user = new UserProfile(
      1001,
      'alice',
      'alice@example.com',
      CborDate.now(),
      tags,
      prefs
    );

    const encoded = user.toCborData();
    const decoded = new UserProfile(0, '', '', CborDate.now(), new CborSet(), new Map()).fromCbor(
      decodeCbor(encoded)
    );

    expect(decoded.id).toBe(1001);
    expect(decoded.username).toBe('alice');
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.tags.contains('admin')).toBe(true);
    expect(decoded.tags.contains('verified')).toBe(true);
  });
});

describe('Event Logging System', () => {
  interface LogEvent {
    timestamp: CborDate;
    level: 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, any>;
  }

  function createLogEvent(
    level: LogEvent['level'],
    message: string,
    metadata?: Record<string, any>
  ): Cbor {
    const map = new CborMap();
    map.set('timestamp', CborDate.now().taggedCbor());
    map.set('level', level);
    map.set('message', message);
    if (metadata) {
      map.set('metadata', metadata);
    }
    return cbor(map);
  }

  test('create and serialize log events', () => {
    const events = [
      createLogEvent('info', 'Application started'),
      createLogEvent('warn', 'High memory usage', { memory: '85%' }),
      createLogEvent('error', 'Connection failed', {
        host: 'api.example.com',
        port: 443,
      }),
    ];

    const logArray = cbor(events);
    const encoded = encodeCbor(logArray);
    const decoded = decodeCbor(encoded);

    expect(decoded.type).toBe(MajorType.Array);
    const decodedEvents = decoded.value as Cbor[];
    expect(decodedEvents.length).toBe(3);

    // Check first event
    const firstEvent = decodedEvents[0];
    expect(firstEvent.type).toBe(MajorType.Map);
    const map = firstEvent.value as CborMap;
    expect(map.get<string, string>('level')).toBe('info');
    expect(map.get<string, string>('message')).toBe('Application started');
  });
});

// ============================================================================
// Deterministic Encoding Tests
// ============================================================================

describe('Deterministic Encoding', () => {
  test('same value encodes to same bytes', () => {
    const value = {
      name: 'Alice',
      age: 30,
      tags: ['user', 'admin'],
    };

    const encoded1 = encodeCbor(cbor(value));
    const encoded2 = encodeCbor(cbor(value));

    expect(encoded1).toEqual(encoded2);
  });

  test('map keys are sorted', () => {
    const map1 = new CborMap();
    map1.set('z', 1);
    map1.set('a', 2);
    map1.set('m', 3);

    const map2 = new CborMap();
    map2.set('a', 2);
    map2.set('m', 3);
    map2.set('z', 1);

    const encoded1 = encodeCbor(cbor(map1));
    const encoded2 = encodeCbor(cbor(map2));

    expect(encoded1).toEqual(encoded2);
  });

  test('set elements are sorted', () => {
    const set1 = new CborSet();
    [3, 1, 2, 5, 4].forEach(n => set1.insert(n));

    const set2 = new CborSet();
    [5, 4, 3, 2, 1].forEach(n => set2.insert(n));

    const encoded1 = encodeCbor(set1.toCbor());
    const encoded2 = encodeCbor(set2.toCbor());

    expect(encoded1).toEqual(encoded2);
  });
});

// ============================================================================
// Walk/Traversal Integration Tests
// ============================================================================

describe('Tree Traversal Integration', () => {
  test('count all elements in complex structure', () => {
    const data = cbor({
      users: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
      metadata: {
        version: 1,
        count: 2,
      },
    });

    const initialCount = 0;
    const finalCount = walk(data, initialCount, (elem, level, edge, state) => {
      return [state + 1, false];
    });

    // Should count: root map + users key + array + 2 user maps + 4 keys + 4 values + metadata key + metadata map + 2 keys + 2 values
    expect(finalCount).toBeGreaterThan(10);
  });

  test('collect all text strings', () => {
    const data = cbor({
      name: 'Alice',
      city: 'Boston',
      tags: ['admin', 'user', 'verified'],
    });

    const texts: string[] = [];
    walk(data, texts, (elem, level, edge, state) => {
      if (elem.type === 'single' && elem.cbor?.type === MajorType.Text) {
        state.push(elem.cbor.value);
      } else if (elem.type === 'keyvalue') {
        if (elem.key?.type === MajorType.Text) {
          state.push(elem.key.value);
        }
      }
      return [state, false];
    });

    expect(texts).toContain('Alice');
    expect(texts).toContain('Boston');
    expect(texts).toContain('admin');
    expect(texts).toContain('user');
    expect(texts).toContain('verified');
  });
});

// ============================================================================
// Diagnostic Output Integration
// ============================================================================

describe('Diagnostic Integration', () => {
  test('formatted output for complex structure', () => {
    const data = cbor({
      name: 'Alice',
      age: 30,
      active: true,
    });

    const diag = diagnostic(data);
    expect(diag).toContain('Alice');
    expect(diag).toContain('30');
    expect(diag).toContain('true');
  });

  test('annotated output with tagged values', () => {
    const date = CborDate.now();
    const tagged = date.taggedCbor();

    const annotated = diagnosticAnnotated(tagged);
    expect(annotated).toContain('date(');
  });

  test('diagnostic for set', () => {
    const set = new CborSet();
    set.insert(1);
    set.insert(2);
    set.insert(3);

    const diag = diagnosticAnnotated(set.taggedCbor());
    expect(diag).toContain('set(');
  });
});

// ============================================================================
// Tag System Integration
// ============================================================================

describe('Tag System Integration', () => {
  test('global tag store has standard tags', () => {
    const store = getGlobalTagsStore();

    expect(store.tagForValue(1)).toBeDefined(); // Date
    expect(store.tagForValue(258)).toBeDefined(); // Set
    expect(store.nameForValue(1)).toBe('date');
    expect(store.nameForValue(258)).toBe('set');
  });

  test('custom type with multiple tags', () => {
    const location: Cbor = {
      isCbor: true as const,
      type: MajorType.Tagged as MajorType.Tagged,
      tag: 999,
      value: cbor({ lat: 42.3601, lon: -71.0589 }),
    };

    expect(conv.hasTag(location, 999)).toBe(true);
    expect(conv.tagValue(location)).toBe(999);

    const content = conv.tagContent(location);
    expect(content).toBeDefined();
    expect(content!.type).toBe(MajorType.Map);
  });
});

// ============================================================================
// Error Handling Integration
// ============================================================================

describe('Error Handling Integration', () => {
  test('type mismatch in extraction', () => {
    const data = cbor(42);

    expect(() => conv.expectText(data)).toThrow('Expected text string');
    expect(() => conv.expectArray(data)).toThrow('Expected array');
    expect(() => conv.expectMap(data)).toThrow('Expected map');
  });

  test('safe extraction returns undefined', () => {
    const data = cbor(42);

    expect(conv.asText(data)).toBeUndefined();
    expect(conv.asArray(data)).toBeUndefined();
    expect(conv.asMap(data)).toBeUndefined();
  });

  test('array index out of bounds', () => {
    const arr = cbor([1, 2, 3]);

    expect(conv.arrayItem(arr, 0)).toBeDefined();
    expect(conv.arrayItem(arr, 10)).toBeUndefined();
    expect(conv.arrayItem(arr, -1)).toBeUndefined();
  });
});

// ============================================================================
// Round-Trip Tests
// ============================================================================

describe('Round-Trip Encoding/Decoding', () => {
  test('primitives round-trip', () => {
    const values = [
      42,
      -17,
      'hello',
      true,
      false,
      null,
      3.14,
      new Uint8Array([1, 2, 3]),
    ];

    for (const value of values) {
      const encoded = encodeCbor(cbor(value));
      const decoded = decodeCbor(encoded);
      const extracted = extractCbor(decoded);

      if (value instanceof Uint8Array) {
        expect(extracted).toEqual(value);
      } else {
        expect(extracted).toEqual(value);
      }
    }
  });

  test('arrays round-trip', () => {
    const arrays = [[], [1], [1, 2, 3], [[1, 2], [3, 4]], ['a', 'b', 'c']];

    for (const arr of arrays) {
      const encoded = encodeCbor(cbor(arr));
      const decoded = decodeCbor(encoded);
      const extracted = extractCbor(decoded);

      expect(extracted).toEqual(arr);
    }
  });

  test('maps round-trip', () => {
    const map = new CborMap();
    map.set('name', 'Alice');
    map.set('age', 30);
    map.set('active', true);

    const encoded = encodeCbor(cbor(map));
    const decoded = decodeCbor(encoded);

    expect(decoded.type).toBe(MajorType.Map);
    const decodedMap = decoded.value as CborMap;
    expect(decodedMap.get<string, string>('name')).toBe('Alice');
    expect(decodedMap.get<string, number>('age')).toBe(30);
  });

  test('dates round-trip', () => {
    const date = CborDate.now();
    const encoded = encodeCbor(date.taggedCbor());
    const decoded = decodeCbor(encoded);
    const restored = new CborDate().fromTaggedCbor(decoded);

    // Allow 1 second tolerance
    expect(Math.abs(restored.timestamp() - date.timestamp())).toBeLessThan(1);
  });

  test('sets round-trip', () => {
    const set = new CborSet();
    set.insert(1);
    set.insert(2);
    set.insert(3);

    // Use taggedCbor() to get the tagged version
    const encoded = encodeCbor(set.taggedCbor());
    const decoded = decodeCbor(encoded);
    const restored = new CborSet().fromTaggedCbor(decoded);

    expect(restored.size).toBe(3);
    expect(restored.contains(1)).toBe(true);
    expect(restored.contains(2)).toBe(true);
    expect(restored.contains(3)).toBe(true);
  });
});

// ============================================================================
// Large Data Tests
// ============================================================================

describe('Large Data Handling', () => {
  test('large array', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const encoded = encodeCbor(cbor(largeArray));
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    expect(extracted).toEqual(largeArray);
  });

  test('large map', () => {
    const largeMap = new CborMap();
    for (let i = 0; i < 100; i++) {
      largeMap.set(`key${i}`, `value${i}`);
    }

    const encoded = encodeCbor(cbor(largeMap));
    const decoded = decodeCbor(encoded);
    const decodedMap = decoded.value as CborMap;

    expect(decodedMap.size).toBe(100);
    expect(decodedMap.get<string, string>('key0')).toBe('value0');
    expect(decodedMap.get<string, string>('key99')).toBe('value99');
  });

  test('deeply nested structure', () => {
    let nested: any = 'leaf';
    for (let i = 0; i < 10; i++) {
      nested = { level: i, child: nested };
    }

    const encoded = encodeCbor(cbor(nested));
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    // After extraction, maps become CborMap objects
    let current: any = extracted;
    for (let i = 9; i >= 0; i--) {
      if (current instanceof CborMap) {
        expect(current.get<string, number>('level')).toBe(i);
        current = current.get<string, any>('child');
      } else {
        throw new Error(`Expected CborMap at level ${i}`);
      }
    }
    expect(current).toBe('leaf');
  });
});

// ============================================================================
// Unicode and Special Characters
// ============================================================================

describe('Unicode Handling', () => {
  test('emoji in strings', () => {
    const text = 'Hello 👋 World 🌍 🎉';
    const encoded = encodeCbor(cbor(text));
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    expect(extracted).toBe(text);
  });

  test('various scripts', () => {
    const texts = [
      'English',
      'Español',
      'Français',
      'Deutsch',
      '日本語',
      '中文',
      '한국어',
      'Русский',
      'العربية',
      'עברית',
    ];

    for (const text of texts) {
      const encoded = encodeCbor(cbor(text));
      const decoded = decodeCbor(encoded);
      const extracted = extractCbor(decoded);

      expect(extracted).toBe(text);
    }
  });

  test('special characters', () => {
    const special = 'Line1\nLine2\tTabbed\rReturn"Quote"\\Backslash';
    const encoded = encodeCbor(cbor(special));
    const decoded = decodeCbor(encoded);
    const extracted = extractCbor(decoded);

    expect(extracted).toBe(special);
  });
});
