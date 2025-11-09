/**
 * Standard CBOR tag definitions from the IANA registry.
 *
 * @module tags
 * @see https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
 */

import { Tag, createTag } from './tag';

// ============================================================================
// Standard Date/Time Tags
// ============================================================================

/**
 * Tag 0: Standard date/time string (RFC 3339)
 */
export const TAG_DATE_TIME_STRING = 0;

/**
 * Tag 1: Epoch-based date/time (seconds since 1970-01-01T00:00:00Z)
 */
export const TAG_EPOCH_DATE_TIME = 1;

/**
 * Tag 100: Epoch-based date (days since 1970-01-01)
 */
export const TAG_EPOCH_DATE = 100;

// ============================================================================
// Numeric Tags
// ============================================================================

/**
 * Tag 2: Positive bignum (unsigned arbitrary-precision integer)
 */
export const TAG_POSITIVE_BIGNUM = 2;

/**
 * Tag 3: Negative bignum (signed arbitrary-precision integer)
 */
export const TAG_NEGATIVE_BIGNUM = 3;

/**
 * Tag 4: Decimal fraction [exponent, mantissa]
 */
export const TAG_DECIMAL_FRACTION = 4;

/**
 * Tag 5: Bigfloat [exponent, mantissa]
 */
export const TAG_BIGFLOAT = 5;

// ============================================================================
// Encoding Hints
// ============================================================================

/**
 * Tag 21: Expected conversion to base64url encoding
 */
export const TAG_BASE64URL = 21;

/**
 * Tag 22: Expected conversion to base64 encoding
 */
export const TAG_BASE64 = 22;

/**
 * Tag 23: Expected conversion to base16 encoding
 */
export const TAG_BASE16 = 23;

/**
 * Tag 24: Encoded CBOR data item
 */
export const TAG_ENCODED_CBOR = 24;

// ============================================================================
// URI and Network Tags
// ============================================================================

/**
 * Tag 32: URI (text string)
 */
export const TAG_URI = 32;

/**
 * Tag 33: base64url-encoded text
 */
export const TAG_BASE64URL_TEXT = 33;

/**
 * Tag 34: base64-encoded text
 */
export const TAG_BASE64_TEXT = 34;

/**
 * Tag 35: Regular expression (PCRE/ECMA262)
 */
export const TAG_REGEXP = 35;

/**
 * Tag 36: MIME message
 */
export const TAG_MIME_MESSAGE = 36;

/**
 * Tag 37: Binary UUID
 */
export const TAG_UUID = 37;

// ============================================================================
// Cryptography Tags
// ============================================================================

/**
 * Tag 256: string reference (namespace)
 */
export const TAG_STRING_REF_NAMESPACE = 256;

/**
 * Tag 257: binary UUID reference
 */
export const TAG_BINARY_UUID = 257;

/**
 * Tag 258: Set of values (array with no duplicates)
 */
export const TAG_SET = 258;

// ============================================================================
// Blockchain Commons dCBOR Tags
// ============================================================================

/**
 * Tag 200: Envelope (Blockchain Commons)
 */
export const TAG_ENVELOPE = 200;

/**
 * Tag 201: Known value (Blockchain Commons)
 */
export const TAG_KNOWN_VALUE = 201;

/**
 * Tag 203: Tagged CBOR (Blockchain Commons)
 */
export const TAG_TAGGED_CBOR = 203;

/**
 * Tag 204: Leaf (Blockchain Commons)
 */
export const TAG_LEAF = 204;

/**
 * Tag 221: Compressed (Blockchain Commons)
 */
export const TAG_COMPRESSED = 221;

// ============================================================================
// Self-describing CBOR
// ============================================================================

/**
 * Tag 55799: Self-describe CBOR (magic number 0xd9d9f7)
 */
export const TAG_SELF_DESCRIBE_CBOR = 55799;

// ============================================================================
// Named Tag Objects
// ============================================================================

/**
 * Standard date/time tags with names
 */
export const STANDARD_DATE_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_DATE_TIME_STRING, 'date-time'),
  createTag(TAG_EPOCH_DATE_TIME, 'date'),
  createTag(TAG_EPOCH_DATE, 'epoch-date')
]);

/**
 * Standard numeric tags with names
 */
export const STANDARD_NUMERIC_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_POSITIVE_BIGNUM, 'positive-bignum'),
  createTag(TAG_NEGATIVE_BIGNUM, 'negative-bignum'),
  createTag(TAG_DECIMAL_FRACTION, 'decimal-fraction'),
  createTag(TAG_BIGFLOAT, 'bigfloat')
]);

/**
 * Standard encoding hint tags with names
 */
export const STANDARD_ENCODING_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_BASE64URL, 'base64url'),
  createTag(TAG_BASE64, 'base64'),
  createTag(TAG_BASE16, 'base16'),
  createTag(TAG_ENCODED_CBOR, 'cbor')
]);

/**
 * Standard URI and network tags with names
 */
export const STANDARD_URI_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_URI, 'uri'),
  createTag(TAG_BASE64URL_TEXT, 'base64url-text'),
  createTag(TAG_BASE64_TEXT, 'base64-text'),
  createTag(TAG_REGEXP, 'regexp'),
  createTag(TAG_MIME_MESSAGE, 'mime'),
  createTag(TAG_UUID, 'uuid')
]);

/**
 * Standard set and reference tags with names
 */
export const STANDARD_COLLECTION_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_STRING_REF_NAMESPACE, 'string-ref-namespace'),
  createTag(TAG_BINARY_UUID, 'binary-uuid'),
  createTag(TAG_SET, 'set')
]);

/**
 * Blockchain Commons specific tags with names
 */
export const BLOCKCHAIN_COMMONS_TAGS: readonly Tag[] = Object.freeze([
  createTag(TAG_ENVELOPE, 'envelope'),
  createTag(TAG_KNOWN_VALUE, 'known-value'),
  createTag(TAG_TAGGED_CBOR, 'tagged-cbor'),
  createTag(TAG_LEAF, 'leaf'),
  createTag(TAG_COMPRESSED, 'compressed')
]);

/**
 * All standard tags combined
 */
export const ALL_STANDARD_TAGS: readonly Tag[] = Object.freeze([
  ...STANDARD_DATE_TAGS,
  ...STANDARD_NUMERIC_TAGS,
  ...STANDARD_ENCODING_TAGS,
  ...STANDARD_URI_TAGS,
  ...STANDARD_COLLECTION_TAGS,
  ...BLOCKCHAIN_COMMONS_TAGS,
  createTag(TAG_SELF_DESCRIBE_CBOR, 'self-describe-cbor')
]);

/**
 * Get a Tag object by its numeric value from the standard tags.
 *
 * @param value - The numeric tag value to look up
 * @returns The Tag object if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const dateTag = getStandardTag(1);
 * console.log(dateTag?.name); // 'date'
 * ```
 */
export function getStandardTag(value: number | bigint): Tag | undefined {
  return ALL_STANDARD_TAGS.find(tag => tag.value === value);
}

/**
 * Check if a tag value is a standard tag.
 *
 * @param value - The numeric tag value to check
 * @returns true if the value corresponds to a standard tag
 */
export function isStandardTag(value: number | bigint): boolean {
  return ALL_STANDARD_TAGS.some(tag => tag.value === value);
}

// ============================================================================
// Global Tags Store Registration
// Matches Rust's register_tags() functionality
// ============================================================================

import { TagsStore, getGlobalTagsStore } from './tags-store';
import { CborDate } from './date';
import { Cbor } from './cbor';

// Tag constants matching Rust
export const TAG_DATE = 1;
export const TAG_NAME_DATE = 'date';

/**
 * Register standard tags in a specific tags store.
 * Matches Rust's register_tags_in() function.
 *
 * @param tagsStore - The tags store to register tags into
 */
export function registerTagsIn(tagsStore: TagsStore): void {
  const tags = [createTag(TAG_DATE, TAG_NAME_DATE)];
  tagsStore.insertAll(tags);

  // Set summarizer for date tag
  tagsStore.setSummarizer(
    TAG_DATE,
    (untaggedCbor: Cbor, _flat: boolean): string => {
      try {
        return CborDate.fromUntaggedCbor(untaggedCbor).toString();
      } catch (_e) {
        return String(untaggedCbor);
      }
    }
  );
}

/**
 * Register standard tags in the global tags store.
 * Matches Rust's register_tags() function.
 *
 * This function is idempotent - calling it multiple times is safe.
 */
export function registerTags(): void {
  const globalStore = getGlobalTagsStore();
  registerTagsIn(globalStore);
}

/**
 * Converts an array of tag values to their corresponding Tag objects.
 * Matches Rust's tags_for_values() function.
 *
 * This function looks up each tag value in the global tag registry and returns
 * an array of complete Tag objects. For any tag values that aren't
 * registered in the global registry, it creates a basic Tag with just the
 * value (no name).
 *
 * @param values - Array of numeric tag values to convert
 * @returns Array of Tag objects corresponding to the input values
 *
 * @example
 * ```typescript
 * // Register some tags first
 * registerTags();
 *
 * // Convert tag values to Tag objects
 * const tags = tagsForValues([1, 42, 999]);
 *
 * // The first tag (value 1) should be registered as "date"
 * console.log(tags[0].value); // 1
 * console.log(tags[0].name); // "date"
 *
 * // Unregistered tags will have a value but no name
 * console.log(tags[1].value); // 42
 * console.log(tags[2].value); // 999
 * ```
 */
export function tagsForValues(values: Array<number | bigint>): Tag[] {
  const globalStore = getGlobalTagsStore();
  return values.map(value => {
    const tag = globalStore.tagForValue(value);
    if (tag) {
      return tag;
    }
    // Create basic tag with just the value
    return createTag(value);
  });
}
