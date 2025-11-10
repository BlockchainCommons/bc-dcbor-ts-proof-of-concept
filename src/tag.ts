/**
 * CBOR Tag support for semantic tagging of values.
 *
 * Tags provide semantic information about CBOR data items.
 * For example, tag 1 indicates a date/time value.
 *
 * @module tag
 */

import { CborNumber } from './cbor';

/**
 * A CBOR tag with an optional name.
 *
 * Tags consist of a numeric value and an optional human-readable name.
 */
export interface Tag {
  /** The numeric tag value */
  value: CborNumber;
  /** Optional human-readable name for the tag */
  name?: string;
}

/**
 * Create a new Tag.
 *
 * @param value - The numeric tag value
 * @param name - Optional human-readable name
 * @returns A new Tag object
 *
 * @example
 * ```typescript
 * const dateTag = createTag(1, 'date');
 * const customTag = createTag(12345, 'myCustomTag');
 * ```
 */
export function createTag(value: CborNumber, name?: string): Tag {
  return { value, name };
}

/**
 * Check if two tags are equal (same numeric value).
 *
 * @param a - First tag
 * @param b - Second tag
 * @returns true if tags have the same value
 */
export function tagsEqual(a: Tag, b: Tag): boolean {
  return a.value === b.value;
}

/**
 * Get the string representation of a tag.
 *
 * @param tag - The tag to represent
 * @returns String representation (name if available, otherwise value)
 *
 * @example
 * ```typescript
 * tagToString(createTag(1, 'date')); // 'date'
 * tagToString(createTag(99)); // '99'
 * ```
 */
export function tagToString(tag: Tag): string {
  return tag.name ?? tag.value.toString();
}
