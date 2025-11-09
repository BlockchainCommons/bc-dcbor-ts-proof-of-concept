/**
 * Prelude module - Re-exports all public APIs for convenient importing.
 *
 * This module provides a single entry point to import all commonly used
 * types, functions, and interfaces from the dcbor library.
 *
 * Equivalent to Rust's prelude.rs
 *
 * @module prelude
 *
 * @example
 * ```typescript
 * import { Cbor, cbor, CborMap, decodeCbor, diagnostic } from './prelude';
 * ```
 */

// Core types
export { Cbor, MajorType } from './cbor';
export type { Simple } from './simple';
export type {
  CborUnsignedType,
  CborNegativeType,
  CborByteStringType,
  CborTextType,
  CborArrayType,
  CborMapType,
  CborTaggedType,
  CborSimpleType,
  CborNumber
} from './cbor';

// Encoding/Decoding
export { cbor, cborData } from './encode';
export { decodeCbor } from './decode';

// Codable interfaces
export type { CBOREncodable, CBORDecodable, CBORCodable } from './cbor-codable';

// Tagged value interfaces
export type { CBORTagged, CBORTaggedEncodable, CBORTaggedDecodable, CBORTaggedCodable } from './cbor-tagged';

// Map and Set
export { CborMap } from './map';
export { CborSet } from './set';

// Date
export { CborDate } from './date';

// Tag handling
export { Tag, createTag, tagsEqual, tagToString } from './tag';
export { TagsStore, getGlobalTagsStore } from './tags-store';
export type { TagsStoreTrait } from './tags-store';

// Diagnostic formatting
export { diagnostic, diagnosticAnnotated, diagnosticFlat, diagnosticOpt, summary } from './diag';
export type { DiagFormatOpts } from './diag';
export { cborDebug, cborDiagnostic } from './debug';

// Walk/traversal
export { walk, EdgeType } from './walk';
export type { WalkElement, EdgeTypeVariant, Visitor } from './walk';

// Error handling
export type { Error, Result } from './error';
export { Ok, Err, errorMsg, errorToString, throwError } from './error';

// Utilities
export { bytesToHex, hexToBytes } from './data-utils';
export { isFloat } from './simple';
export { numberToBinary, binaryToNumber } from './float';

// Conveniences
export { isBoolean, asNumber, asText, isArray, isMap, asBytes, isTagged } from './conveniences';
