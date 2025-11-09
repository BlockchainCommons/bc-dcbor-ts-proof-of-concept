/**
 * BC-DCBOR TypeScript Library
 *
 * A TypeScript implementation of Blockchain Commons' Deterministic CBOR (dCBOR).
 * Port of bc-dcbor-rust.
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
  SimpleValue,
  isSimpleValue,
  isSimpleFloat,
  simpleName,
  isFloat,
  isNaN,
} from './simple';

export { cbor } from './encode';
export { decode } from './decode';

// Map and Set
export { CborMap, CborMapEntry } from './map';
export { CborSet } from './set';

// Tags and Tagged values
export { Tag, TagValue } from './tag';
export { CborTagged } from './cbor-tagged';
export { TagsStore, TagsStoreTrait } from './tags-store';
export * from './tags';

// Date utilities
export { CborDate } from './date';

// Diagnostic formatting
export {
  diagnostic,
  diagnosticFlat,
  DiagnosticOptions
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
  CborCodable,
  CborEncodable,
  CborDecodable
} from './codable';

// Error types
export {
  CborError,
  DecodeError,
  EncodeError
} from './error';

// Convenience functions
export * from './conveniences';

// Float utilities
export { encodeFloat } from './float';

// Data utilities
export { toHex, fromHex } from './data-utils';

// Varint utilities
export {
  encodeVarint,
  decodeVarint,
  varintEncodedLength
} from './varint';
