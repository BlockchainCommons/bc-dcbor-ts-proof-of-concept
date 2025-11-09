/**
 * BC-DCBOR TypeScript Library
 *
 * A TypeScript implementation of Blockchain Commons' Deterministic CBOR (dCBOR).
 * 1:1 port of bc-dcbor-rust.
 *
 * @module bc-dcbor
 */

// Core CBOR types and encoding/decoding
export {
  Cbor,
  MajorType,
  CborUnsignedType,
  CborNegativeType,
  CborByteStringType,
  CborTextType,
  CborArrayType,
  CborMapType,
  CborTaggedType,
  CborSimpleType,
} from './cbor';

// Simple value types
export {
  Simple,
  simpleName,
  isFloat,
  isNaN,
} from './simple';

// Encoding/Decoding
export { cbor, cborData } from './encode';
export { decodeCbor } from './decode';

// Map and Set
export { CborMap, MapEntry } from './map';
export { CborSet } from './set';

// Tags and Tagged values
export { Tag } from './tag';
export { CBORTagged } from './cbor-tagged';
export { TagsStore, TagsStoreTrait } from './tags-store';
export * from './tags';

// Date utilities
export { CborDate } from './date';

// Diagnostic formatting
export {
  diagnostic,
  diagnosticFlat,
  diagnosticAnnotated,
  DiagFormatOpts
} from './diag';

// Walk/Traversal functionality
export {
  walk,
  EdgeType,
  EdgeTypeVariant,
  WalkElement,
  Visitor,
  asSingle,
  asKeyValue,
  edgeLabel,
  // Helper functions
  countElements,
  collectAtLevel,
  findFirst,
  collectAllText,
  maxDepth
} from './walk';

// Codable interfaces
export {
  CBORCodable,
  CBOREncodable,
  CBORDecodable
} from './cbor-codable';

// Error types (matches Rust's Error enum)
export {
  Error,
  Result,
  Ok,
  Err,
  errorMsg,
  errorToString,
  throwError
} from './error';

// Convenience functions
export * from './conveniences';

// Float utilities
export { f64CborData, hasFractionalPart } from './float';

// Varint utilities
export {
  encodeVarInt,
  decodeVarInt,
  decodeVarIntData
} from './varint';

// Exact type extraction
export {
  exactUnsigned,
  exactNegative,
  exactInteger,
  exactString,
  exactBytes,
  exactArray
} from './exact';

// Type utilities
export { asInteger, asUnsigned, asNegative } from './conveniences';
export { asByteString } from './byte-string';
export { asString } from './string';
export { asArray } from './array';
export { asBoolean } from './bool-value';
