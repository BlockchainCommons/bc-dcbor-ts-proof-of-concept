/**
 * Tagged CBOR encoding and decoding support.
 *
 * This module provides the `CBORTaggedCodable` interface, which serves as a
 * convenience marker for types that can be both encoded to and decoded from
 * tagged CBOR values.
 *
 * The interface is automatically implemented for any type that implements both
 * `CBORTaggedEncodable` and `CBORTaggedDecodable`.
 *
 * This file exists for 1:1 correspondence with Rust's cbor_tagged_codable.rs.
 *
 * @module cbor-tagged-codable
 */

import { CBORTaggedEncodable } from './cbor-tagged-encodable';
import { CBORTaggedDecodable } from './cbor-tagged-decodable';

/**
 * Interface for types that can be both encoded to and decoded from CBOR with a
 * specific tag.
 *
 * This interface is automatically implemented for any type that implements both
 * `CBORTaggedEncodable` and `CBORTaggedDecodable`. It serves as a convenience
 * marker to indicate full tagged CBOR serialization support.
 *
 * @example
 * ```typescript
 * // Define a Date type
 * class Date implements CBORTaggedCodable<Date> {
 *   constructor(public timestamp: number) {}
 *
 *   cborTags(): Tag[] {
 *     return [createTag(1, 'date')]; // Standard date tag
 *   }
 *
 *   // Implement encoding to tagged CBOR
 *   untaggedCbor(): Cbor {
 *     return cbor(this.timestamp);
 *   }
 *
 *   taggedCbor(): Cbor {
 *     const tags = this.cborTags();
 *     return {
 *       isCbor: true,
 *       type: MajorType.Tagged,
 *       tag: tags[0].value,
 *       value: this.untaggedCbor()
 *     };
 *   }
 *
 *   // Implement decoding from tagged CBOR
 *   fromUntaggedCbor(cbor: Cbor): Date {
 *     const timestamp = cbor.value as number;
 *     return new Date(timestamp);
 *   }
 *
 *   fromTaggedCbor(cbor: Cbor): Date {
 *     if (cbor.type !== MajorType.Tagged) {
 *       throw new Error('Wrong type');
 *     }
 *     return this.fromUntaggedCbor(cbor.value);
 *   }
 * }
 *
 * // The CBORTaggedCodable interface is automatically implemented
 * // Create a date and demonstrate round-trip conversion
 * const original = new Date(1609459200);
 * const cborValue = original.taggedCbor();
 * const roundtrip = new Date(0).fromTaggedCbor(cborValue);
 * assert(original.timestamp === roundtrip.timestamp);
 * ```
 */
export interface CBORTaggedCodable<T> extends CBORTaggedEncodable, CBORTaggedDecodable<T> {}
