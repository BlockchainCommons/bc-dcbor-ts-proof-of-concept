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
  type CborEncodable,
  MajorType,
  type CborUnsignedType,
  type CborNegativeType,
  type CborByteStringType,
  type CborTextType,
  type CborArrayType,
  type CborMapType,
  type CborTaggedType,
  type CborSimpleType,
} from './cbor';

// Simple value types
export {
  type Simple,
  simpleName,
  isFloat,
  isNaN,
} from './simple';

// Encoding/Decoding
export { cbor, cborData } from './cbor';
export { decodeCbor } from './decode';

// Convenience functions
export {
  // Byte String conveniences
  toByteString,
  toByteStringFromHex,
  tryIntoByteString,
  isByteString,
  intoByteString,
  tryByteString,
  asByteString,
  // Tagged Value conveniences
  toTaggedValue,
  tryIntoTaggedValue,
  isTaggedValue,
  asTaggedValue,
  tryTaggedValue,
  tryIntoExpectedTaggedValue,
  tryExpectedTaggedValue,
  // Text String conveniences
  tryIntoText,
  isText,
  tryText,
  intoText,
  asText,
  // Array conveniences
  tryIntoArray,
  isArray as isCborArray,
  tryArray,
  intoArray,
  asArray as asCborArray,
  // Map conveniences
  tryIntoMap,
  isMap as isCborMap,
  tryMap,
  intoMap,
  asMap as asCborMap,
  tryIntoSimpleValue,
  // Boolean conveniences
  cborFalse,
  cborTrue,
  asBool,
  tryIntoBool,
  isBool,
  tryBool,
  isTrue,
  isFalse,
  // Null conveniences
  cborNull,
  isNull,
  // Number conveniences
  isNumber,
  isNaN as isCborNaN,
  cborNaN
} from './cbor';

// Map and Set
export { CborMap, type MapEntry } from './map';
export { CborSet } from './set';

// Tags and Tagged values
export { type Tag } from './tag';
export {
  type CBORTagged,
  type CBORTaggedEncodable,
  type CBORTaggedDecodable,
  type CBORTaggedCodable,
  createTaggedCbor,
  validateTag,
  extractTaggedContent
} from './cbor-tagged';
export { TagsStore, type TagsStoreTrait } from './tags-store';
export * from './tags';
export { registerTags, registerTagsIn, tagsForValues } from './tags';

// Date utilities
export { CborDate } from './date';

// Diagnostic formatting
export {
  diagnostic,
  diagnosticFlat,
  diagnosticAnnotated,
  diagnosticOpt,
  summary,
  type DiagFormatOpts
} from './diag';

// Hex formatting
export {
  hex,
  hexOpt,
  hexAnnotated,
  hexToBytes,
  bytesToHex,
  type HexFormatOpts
} from './dump';

// Walk/Traversal functionality
export {
  walk,
  type EdgeType,
  type EdgeTypeVariant,
  type WalkElement,
  type Visitor,
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
  type CBORCodable,
  type CBOREncodable,
  type CBORDecodable
} from './cbor-codable';

// Error types (matches Rust's Error enum)
export {
  type Error,
  type Result,
  Ok,
  Err,
  errorMsg,
  errorToString,
  throwError
} from './error';

// Note: conveniences.ts is an internal module (not exported in Rust either)
// The main convenience functions are exported from cbor.ts above

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
export { ByteString } from './byte-string';
export { isString, asString } from './string';
