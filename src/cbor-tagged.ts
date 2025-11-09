/**
 * Interfaces for types that can be encoded/decoded with CBOR tags.
 *
 * These interfaces provide a trait-like system for TypeScript types
 * to declare their associated CBOR tags and encoding/decoding behavior.
 *
 * @module cbor-tagged
 */

import { Cbor, MajorType, CborTaggedType } from './cbor';
import { Tag } from './tag';

/**
 * Interface for types that have associated CBOR tags.
 *
 * Implement this interface to declare which tags are associated
 * with your type.
 */
export interface CBORTagged {
  /**
   * Get the CBOR tags associated with this type.
   *
   * @returns Array of tags (usually one, but can be multiple)
   *
   * @example
   * ```typescript
   * class MyType implements CBORTagged {
   *   cborTags(): Tag[] {
   *     return [createTag(12345, 'myType')];
   *   }
   * }
   * ```
   */
  cborTags(): Tag[];
}

/**
 * Interface for types that can be encoded as tagged CBOR values.
 *
 * Implement this to provide custom CBOR encoding with tags.
 */
export interface CBORTaggedEncodable extends CBORTagged {
  /**
   * Encode this value as CBOR without the tag wrapper.
   *
   * @returns The untagged CBOR representation
   *
   * @example
   * ```typescript
   * class Point implements CBORTaggedEncodable {
   *   constructor(public x: number, public y: number) {}
   *
   *   cborTags(): Tag[] {
   *     return [createTag(9999, 'point')];
   *   }
   *
   *   untaggedCbor(): Cbor {
   *     return cbor([this.x, this.y]);
   *   }
   *
   *   taggedCbor(): Cbor {
   *     return createTaggedCbor(this);
   *   }
   * }
   * ```
   */
  untaggedCbor(): Cbor;

  /**
   * Encode this value as tagged CBOR.
   *
   * Default implementation wraps untaggedCbor() with the first tag.
   *
   * @returns The tagged CBOR representation
   */
  taggedCbor(): Cbor;
}

/**
 * Interface for types that can be decoded from tagged CBOR values.
 */
export interface CBORTaggedDecodable<T> extends CBORTagged {
  /**
   * Decode from untagged CBOR.
   *
   * @param cbor - The untagged CBOR value
   * @returns Instance of this type
   *
   * @example
   * ```typescript
   * class Point implements CBORTaggedDecodable<Point> {
   *   constructor(public x: number = 0, public y: number = 0) {}
   *
   *   cborTags(): Tag[] {
   *     return [createTag(9999, 'point')];
   *   }
   *
   *   fromUntaggedCbor(cbor: Cbor): Point {
   *     if (cbor.type !== MajorType.Array || cbor.value.length !== 2) {
   *       throw new Error('Expected array with 2 elements');
   *     }
   *     const x = extractCbor(cbor.value[0]) as number;
   *     const y = extractCbor(cbor.value[1]) as number;
   *     return new Point(x, y);
   *   }
   *
   *   fromTaggedCbor(cbor: Cbor): Point {
   *     if (cbor.type !== MajorType.Tagged) {
   *       throw new Error('Expected tagged value');
   *     }
   *     return this.fromUntaggedCbor(cbor.value);
   *   }
   * }
   * ```
   */
  fromUntaggedCbor(cbor: Cbor): T;

  /**
   * Decode from tagged CBOR.
   *
   * Default implementation validates the tag and calls fromUntaggedCbor().
   *
   * @param cbor - The tagged CBOR value
   * @returns Instance of this type
   */
  fromTaggedCbor(cbor: Cbor): T;
}

/**
 * Combined interface for types that can both encode and decode with tags.
 */
export interface CBORTaggedCodable<T> extends CBORTaggedEncodable, CBORTaggedDecodable<T> {}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a tagged CBOR value from an encodable object.
 *
 * Uses the first tag from cborTags().
 *
 * @param encodable - Object that can be encoded with tags
 * @returns Tagged CBOR value
 * @throws Error if no tags are defined
 *
 * @example
 * ```typescript
 * const point = new Point(10, 20);
 * const tagged = createTaggedCbor(point);
 * // Returns: { type: MajorType.Tagged, tag: 9999, value: [10, 20] }
 * ```
 */
export function createTaggedCbor(encodable: CBORTaggedEncodable): Cbor {
  const tags = encodable.cborTags();
  if (tags.length === 0) {
    throw new Error('No tags defined for this type');
  }

  const tag = tags[0];
  const untagged = encodable.untaggedCbor();

  const result: CborTaggedType = {
    isCbor: true,
    type: MajorType.Tagged,
    tag: tag.value,
    value: untagged
  };

  return result;
}

/**
 * Validate that a CBOR value has one of the expected tags.
 *
 * @param cbor - The CBOR value to check
 * @param expectedTags - Array of valid tags
 * @returns The tag value if valid
 * @throws Error if the value is not tagged or has an unexpected tag
 *
 * @example
 * ```typescript
 * const tags = [createTag(1, 'date')];
 * const tagValue = validateTag(cborValue, tags);
 * ```
 */
export function validateTag(cbor: Cbor, expectedTags: Tag[]): Tag {
  if (cbor.type !== MajorType.Tagged) {
    throw new Error('Expected tagged CBOR value');
  }

  const expectedValues = expectedTags.map(t => t.value);
  const tagValue = cbor.tag;

  if (!expectedValues.some(v => v === tagValue)) {
    const expectedStr = expectedValues.join(' or ');
    throw new Error(
      `Expected tag ${expectedStr}, got ${tagValue}`
    );
  }

  // Find and return the matching tag
  const matchingTag = expectedTags.find(t => t.value === tagValue);
  return matchingTag!;
}

/**
 * Extract the content from a tagged CBOR value.
 *
 * @param cbor - The tagged CBOR value
 * @returns The untagged content
 * @throws Error if the value is not tagged
 *
 * @example
 * ```typescript
 * const content = extractTaggedContent(taggedValue);
 * ```
 */
export function extractTaggedContent(cbor: Cbor): Cbor {
  if (cbor.type !== MajorType.Tagged) {
    throw new Error('Expected tagged CBOR value');
  }
  return cbor.value;
}

/**
 * Check if a CBOR value is tagged with a specific tag.
 *
 * @param cbor - The CBOR value to check
 * @param tag - The tag to check for
 * @returns true if the value is tagged with the specified tag
 *
 * @example
 * ```typescript
 * if (hasTag(cborValue, createTag(1, 'date'))) {
 *   // Process as date
 * }
 * ```
 */
export function hasTag(cbor: Cbor, tag: Tag): boolean {
  return cbor.type === MajorType.Tagged && cbor.tag === tag.value;
}

/**
 * Get the tag value from a tagged CBOR value.
 *
 * @param cbor - The CBOR value
 * @returns The tag value, or undefined if not tagged
 *
 * @example
 * ```typescript
 * const tagValue = getTagValue(cborValue);
 * if (tagValue === 1) {
 *   // It's a date
 * }
 * ```
 */
export function getTagValue(cbor: Cbor): number | bigint | undefined {
  return cbor.type === MajorType.Tagged ? cbor.tag : undefined;
}

/**
 * Apply default taggedCbor() implementation for encodable types.
 *
 * This is a helper for implementing taggedCbor() method.
 *
 * @param self - The object being encoded
 * @returns Tagged CBOR representation
 */
export function defaultTaggedCbor(self: CBORTaggedEncodable): Cbor {
  return createTaggedCbor(self);
}

/**
 * Apply default fromTaggedCbor() implementation for decodable types.
 *
 * This is a helper for implementing fromTaggedCbor() method.
 *
 * @param self - The object being decoded into
 * @param cbor - The tagged CBOR value
 * @returns Decoded instance
 */
export function defaultFromTaggedCbor<T>(
  self: CBORTaggedDecodable<T>,
  cbor: Cbor
): T {
  const expectedTags = self.cborTags();
  validateTag(cbor, expectedTags);
  const content = extractTaggedContent(cbor);
  return self.fromUntaggedCbor(content);
}
