/**
 * Tests for the CBOR tag system.
 */

import { createTag, tagsEqual, tagToString } from './tag';
import { TagsStore, getGlobalTagsStore, withTags, resetGlobalTagsStore } from './tags-store';
import {
  TAG_EPOCH_DATE_TIME,
  TAG_POSITIVE_BIGNUM,
  TAG_URI,
  TAG_SET,
  getStandardTag,
  isStandardTag
} from './tags';
import {
  CBORTaggedEncodable,
  CBORTaggedDecodable,
  CBORTaggedCodable,
  createTaggedCbor,
  validateTag,
  extractTaggedContent,
  hasTag,
  getTagValue
} from './cbor-tagged';
import { cbor } from './encode';
import { Cbor, MajorType } from './cbor';
import { extractCbor } from './extract';

describe('Tag Module Tests', () => {
  describe('Basic Tag Operations', () => {
    test('creates tag with value only', () => {
      const tag = createTag(42);
      expect(tag.value).toBe(42);
      expect(tag.name).toBeUndefined();
    });

    test('creates tag with value and name', () => {
      const tag = createTag(1, 'date');
      expect(tag.value).toBe(1);
      expect(tag.name).toBe('date');
    });

    test('creates tag with bigint value', () => {
      const tag = createTag(999999999999n, 'bigTag');
      expect(tag.value).toBe(999999999999n);
      expect(tag.name).toBe('bigTag');
    });

    test('tags with same value are equal', () => {
      const tag1 = createTag(1, 'date');
      const tag2 = createTag(1, 'epoch-date');
      expect(tagsEqual(tag1, tag2)).toBe(true);
    });

    test('tags with different values are not equal', () => {
      const tag1 = createTag(1);
      const tag2 = createTag(2);
      expect(tagsEqual(tag1, tag2)).toBe(false);
    });

    test('tagToString returns name if available', () => {
      const tag = createTag(1, 'date');
      expect(tagToString(tag)).toBe('date');
    });

    test('tagToString returns value as string if no name', () => {
      const tag = createTag(42);
      expect(tagToString(tag)).toBe('42');
    });
  });

  describe('Standard Tags', () => {
    test('standard tags have correct values', () => {
      expect(TAG_EPOCH_DATE_TIME).toBe(1);
      expect(TAG_POSITIVE_BIGNUM).toBe(2);
      expect(TAG_URI).toBe(32);
      expect(TAG_SET).toBe(258);
    });

    test('getStandardTag finds known tags', () => {
      const dateTag = getStandardTag(1);
      expect(dateTag).toBeDefined();
      expect(dateTag?.value).toBe(1);
      expect(dateTag?.name).toBe('date');
    });

    test('getStandardTag returns undefined for unknown tags', () => {
      const tag = getStandardTag(99999);
      expect(tag).toBeUndefined();
    });

    test('isStandardTag identifies standard tags', () => {
      expect(isStandardTag(1)).toBe(true);
      expect(isStandardTag(2)).toBe(true);
      expect(isStandardTag(258)).toBe(true);
    });

    test('isStandardTag rejects non-standard tags', () => {
      expect(isStandardTag(99999)).toBe(false);
    });
  });

  describe('TagsStore', () => {
    let store: TagsStore;

    beforeEach(() => {
      store = new TagsStore();
    });

    test('initializes with standard tags', () => {
      expect(store.size).toBeGreaterThan(0);
      const dateTag = store.tagForValue(1);
      expect(dateTag).toBeDefined();
      expect(dateTag?.name).toBe('date');
    });

    test('inserts custom tags', () => {
      const customTag = createTag(12345, 'myTag');
      store.insert(customTag);

      const retrieved = store.tagForValue(12345);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('myTag');
    });

    test('looks up tags by name', () => {
      const tag = store.tagForName('date');
      expect(tag).toBeDefined();
      expect(tag?.value).toBe(1);
    });

    test('looks up tags by value', () => {
      const tag = store.tagForValue(1);
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('date');
    });

    test('assignedNameForTag returns registered name', () => {
      const tag = createTag(1, 'different-name');
      const name = store.assignedNameForTag(tag);
      expect(name).toBe('date'); // Returns the registered name
    });

    test('nameForTag returns name or value', () => {
      const namedTag = createTag(1);
      expect(store.nameForTag(namedTag)).toBe('date');

      const unnamedTag = createTag(99999);
      expect(store.nameForTag(unnamedTag)).toBe('99999');
    });

    test('nameForValue returns name or value', () => {
      expect(store.nameForValue(1)).toBe('date');
      expect(store.nameForValue(99999)).toBe('99999');
    });

    test('removes tags', () => {
      const customTag = createTag(12345, 'myTag');
      store.insert(customTag);
      expect(store.tagForValue(12345)).toBeDefined();

      const removed = store.remove(12345);
      expect(removed).toBe(true);
      expect(store.tagForValue(12345)).toBeUndefined();
    });

    test('remove returns false for non-existent tags', () => {
      const removed = store.remove(99999);
      expect(removed).toBe(false);
    });

    test('registers and retrieves summarizers', () => {
      const summarizer = (cbor: Cbor, flat: boolean) => `Summary: ${flat}`;
      store.setSummarizer(1, summarizer);

      const retrieved = store.summarizer(1);
      expect(retrieved).toBeDefined();
      expect(retrieved!(cbor(42), true)).toBe('Summary: true');
    });

    test('getAllTags returns all registered tags', () => {
      const tags = store.getAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.value === 1)).toBe(true);
    });

    test('clear removes all tags', () => {
      store.clear();
      expect(store.size).toBe(0);
      expect(store.getAllTags()).toEqual([]);
    });
  });

  describe('Global Tags Store', () => {
    beforeEach(() => {
      resetGlobalTagsStore();
    });

    test('getGlobalTagsStore returns singleton', () => {
      const store1 = getGlobalTagsStore();
      const store2 = getGlobalTagsStore();
      expect(store1).toBe(store2);
    });

    test('global store has standard tags', () => {
      const store = getGlobalTagsStore();
      expect(store.tagForValue(1)).toBeDefined();
    });

    test('withTags provides access to global store', () => {
      const tagName = withTags(store => store.nameForValue(1));
      expect(tagName).toBe('date');
    });

    test('withTags can insert custom tags', () => {
      withTags(store => {
        store.insert(createTag(12345, 'custom'));
      });

      const tag = withTags(store => store.tagForValue(12345));
      expect(tag?.name).toBe('custom');
    });
  });

  describe('CBORTagged Interfaces', () => {
    // Example implementation: Point type with custom tag
    class Point implements CBORTaggedCodable<Point> {
      constructor(public x: number = 0, public y: number = 0) {}

      cborTags() {
        return [createTag(9999, 'point')];
      }

      untaggedCbor(): Cbor {
        return cbor([this.x, this.y]);
      }

      taggedCbor(): Cbor {
        return createTaggedCbor(this);
      }

      fromUntaggedCbor(c: Cbor): Point {
        if (c.type !== MajorType.Array || c.value.length !== 2) {
          throw new Error('Expected array with 2 elements');
        }
        const x = extractCbor(c.value[0]) as number;
        const y = extractCbor(c.value[1]) as number;
        return new Point(x, y);
      }

      fromTaggedCbor(c: Cbor): Point {
        if (c.type !== MajorType.Tagged) {
          throw new Error('Expected tagged value');
        }
        const expectedTags = this.cborTags();
        validateTag(c, expectedTags);
        return this.fromUntaggedCbor(c.value);
      }
    }

    test('encodes to untagged CBOR', () => {
      const point = new Point(10, 20);
      const untagged = point.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Array);
      if (untagged.type === MajorType.Array) {
        expect(untagged.value.length).toBe(2);
      }
    });

    test('encodes to tagged CBOR', () => {
      const point = new Point(10, 20);
      const tagged = point.taggedCbor();

      expect(tagged.type).toBe(MajorType.Tagged);
      if (tagged.type === MajorType.Tagged) {
        expect(tagged.tag).toBe(9999);
        expect(tagged.value.type).toBe(MajorType.Array);
      }
    });

    test('decodes from untagged CBOR', () => {
      const original = new Point(10, 20);
      const untagged = original.untaggedCbor();
      const decoded = new Point().fromUntaggedCbor(untagged);

      expect(decoded.x).toBe(10);
      expect(decoded.y).toBe(20);
    });

    test('decodes from tagged CBOR', () => {
      const original = new Point(10, 20);
      const tagged = original.taggedCbor();
      const decoded = new Point().fromTaggedCbor(tagged);

      expect(decoded.x).toBe(10);
      expect(decoded.y).toBe(20);
    });

    test('round-trip encoding/decoding', () => {
      const original = new Point(42, 73);
      const tagged = original.taggedCbor();
      const decoded = new Point().fromTaggedCbor(tagged);

      expect(decoded.x).toBe(original.x);
      expect(decoded.y).toBe(original.y);
    });

    test('throws on wrong tag', () => {
      const wrongTagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 8888, // Wrong tag
        value: cbor([10, 20])
      });

      expect(() => {
        new Point().fromTaggedCbor(wrongTagged);
      }).toThrow('Expected tag 9999, got 8888');
    });

    test('throws on untagged value in fromTaggedCbor', () => {
      const untagged = cbor([10, 20]);

      expect(() => {
        new Point().fromTaggedCbor(untagged);
      }).toThrow('Expected tagged value');
    });
  });

  describe('Tagged Value Helpers', () => {
    test('createTaggedCbor creates tagged value', () => {
      class SimpleType implements CBORTaggedEncodable {
        cborTags() {
          return [createTag(123, 'simple')];
        }

        untaggedCbor(): Cbor {
          return cbor(42);
        }

        taggedCbor(): Cbor {
          return createTaggedCbor(this);
        }
      }

      const obj = new SimpleType();
      const tagged = createTaggedCbor(obj);

      expect(tagged.type).toBe(MajorType.Tagged);
      if (tagged.type === MajorType.Tagged) {
        expect(tagged.tag).toBe(123);
      }
    });

    test('createTaggedCbor throws if no tags defined', () => {
      class NoTagsType implements CBORTaggedEncodable {
        cborTags() {
          return [];
        }

        untaggedCbor(): Cbor {
          return cbor(42);
        }

        taggedCbor(): Cbor {
          return createTaggedCbor(this);
        }
      }

      const obj = new NoTagsType();
      expect(() => createTaggedCbor(obj)).toThrow('No tags defined');
    });

    test('validateTag accepts valid tag', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: cbor(42)
      });

      const expectedTags = [createTag(1, 'date')];
      const tag = validateTag(tagged, expectedTags);
      expect(tag.value).toBe(1);
    });

    test('validateTag throws on untagged value', () => {
      const untagged = cbor(42);
      const expectedTags = [createTag(1, 'date')];

      expect(() => validateTag(untagged, expectedTags)).toThrow(
        'Expected tagged CBOR value'
      );
    });

    test('validateTag throws on wrong tag', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 2,
        value: cbor(42)
      });

      const expectedTags = [createTag(1, 'date')];
      expect(() => validateTag(tagged, expectedTags)).toThrow(
        'Expected tag 1, got 2'
      );
    });

    test('extractTaggedContent extracts content', () => {
      const content = cbor([1, 2, 3]);
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: content
      });

      const extracted = extractTaggedContent(tagged);
      expect(extracted).toBe(content);
    });

    test('extractTaggedContent throws on untagged value', () => {
      const untagged = cbor(42);
      expect(() => extractTaggedContent(untagged)).toThrow(
        'Expected tagged CBOR value'
      );
    });

    test('hasTag checks for specific tag', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 1,
        value: cbor(42)
      });

      const dateTag = createTag(1, 'date');
      const otherTag = createTag(2, 'other');

      expect(hasTag(tagged, dateTag)).toBe(true);
      expect(hasTag(tagged, otherTag)).toBe(false);
    });

    test('hasTag returns false for untagged value', () => {
      const untagged = cbor(42);
      const dateTag = createTag(1, 'date');

      expect(hasTag(untagged, dateTag)).toBe(false);
    });

    test('getTagValue returns tag value', () => {
      const tagged = cbor({
        isCbor: true,
        type: MajorType.Tagged,
        tag: 123,
        value: cbor(42)
      });

      expect(getTagValue(tagged)).toBe(123);
    });

    test('getTagValue returns undefined for untagged value', () => {
      const untagged = cbor(42);
      expect(getTagValue(untagged)).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    test('custom type with global tag registry', () => {
      resetGlobalTagsStore();

      class CustomData implements CBORTaggedCodable<CustomData> {
        constructor(public data: string = '') {}

        cborTags() {
          return [createTag(55555, 'customData')];
        }

        untaggedCbor(): Cbor {
          return cbor(this.data);
        }

        taggedCbor(): Cbor {
          return createTaggedCbor(this);
        }

        fromUntaggedCbor(c: Cbor): CustomData {
          if (c.type !== MajorType.Text) {
            throw new Error('Expected text');
          }
          return new CustomData(c.value);
        }

        fromTaggedCbor(c: Cbor): CustomData {
          validateTag(c, this.cborTags());
          return this.fromUntaggedCbor(extractTaggedContent(c));
        }
      }

      // Register with global store
      withTags(store => {
        store.insert(createTag(55555, 'customData'));
      });

      // Encode and decode
      const original = new CustomData('Hello, World!');
      const tagged = original.taggedCbor();
      const decoded = new CustomData().fromTaggedCbor(tagged);

      expect(decoded.data).toBe('Hello, World!');

      // Check global store
      const tagName = withTags(store => store.nameForValue(55555));
      expect(tagName).toBe('customData');
    });

    test('multiple tags for same type', () => {
      class MultiTagType implements CBORTaggedEncodable {
        cborTags() {
          return [
            createTag(100, 'primary'),
            createTag(101, 'secondary'),
            createTag(102, 'tertiary')
          ];
        }

        untaggedCbor(): Cbor {
          return cbor('data');
        }

        taggedCbor(): Cbor {
          // Uses first tag by default
          return createTaggedCbor(this);
        }
      }

      const obj = new MultiTagType();
      const tagged = obj.taggedCbor();

      // Should use first tag
      expect(getTagValue(tagged)).toBe(100);

      // All tags are valid for this type
      const tags = obj.cborTags();
      expect(tags.length).toBe(3);
    });
  });
});
