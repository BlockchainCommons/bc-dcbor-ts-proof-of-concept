/**
 * CBOR Codable interfaces for custom type integration.
 *
 * Provides TypeScript equivalents to Rust's CBOREncodable and CBORDecodable traits,
 * enabling custom types to be seamlessly encoded to and decoded from CBOR format.
 *
 * @module codable
 */

import { Cbor } from './cbor';
import { encodeCbor } from './encode';

/**
 * Interface for types that can be encoded to CBOR.
 *
 * Equivalent to Rust's `CBOREncodable` trait.
 *
 * @example
 * ```typescript
 * class Point implements CBOREncodable {
 *   constructor(public x: number, public y: number) {}
 *
 *   toCbor(): Cbor {
 *     const map = new CborMap();
 *     map.set('x', this.x);
 *     map.set('y', this.y);
 *     return cbor(map);
 *   }
 *
 *   toCborData(): Uint8Array {
 *     return encodeCbor(this.toCbor());
 *   }
 * }
 * ```
 */
export interface CBOREncodable {
  /**
   * Convert this object to a CBOR value.
   *
   * @returns CBOR representation of this object
   */
  toCbor(): Cbor;

  /**
   * Convert this object directly to CBOR-encoded bytes.
   *
   * Default implementation encodes the result of `toCbor()`.
   *
   * @returns CBOR-encoded byte representation
   */
  toCborData(): Uint8Array;
}

/**
 * Interface for types that can be decoded from CBOR.
 *
 * Equivalent to Rust's `CBORDecodable` trait.
 *
 * @typeParam T - The type being decoded
 *
 * @example
 * ```typescript
 * class Point implements CBORDecodable<Point> {
 *   constructor(public x: number = 0, public y: number = 0) {}
 *
 *   fromCbor(cbor: Cbor): Point {
 *     if (cbor.type !== MajorType.Map) {
 *       throw new Error('Expected map');
 *     }
 *     const map = cbor.value as CborMap;
 *     const x = extractCbor(map.get('x')!) as number;
 *     const y = extractCbor(map.get('y')!) as number;
 *     return new Point(x, y);
 *   }
 *
 *   tryFromCbor(cbor: Cbor): Point | Error {
 *     try {
 *       return this.fromCbor(cbor);
 *     } catch (error) {
 *       return error instanceof Error ? error : new Error(String(error));
 *     }
 *   }
 * }
 * ```
 */
export interface CBORDecodable<T> {
  /**
   * Decode a CBOR value into this type.
   *
   * @param cbor - CBOR value to decode
   * @returns Decoded instance of type T
   * @throws Error if decoding fails
   */
  fromCbor(cbor: Cbor): T;

  /**
   * Try to decode a CBOR value into this type.
   *
   * Returns Error instead of throwing if decoding fails.
   *
   * @param cbor - CBOR value to decode
   * @returns Decoded instance or Error
   */
  tryFromCbor(cbor: Cbor): T | Error;
}

/**
 * Combined interface for types that can be both encoded to and decoded from CBOR.
 *
 * Equivalent to implementing both `CBOREncodable` and `CBORDecodable` traits in Rust.
 *
 * @typeParam T - The type being encoded/decoded
 *
 * @example
 * ```typescript
 * class Person implements CBORCodable<Person> {
 *   constructor(public name: string, public age: number) {}
 *
 *   toCbor(): Cbor {
 *     const map = new CborMap();
 *     map.set('name', this.name);
 *     map.set('age', this.age);
 *     return cbor(map);
 *   }
 *
 *   toCborData(): Uint8Array {
 *     return encodeCbor(this.toCbor());
 *   }
 *
 *   fromCbor(cbor: Cbor): Person {
 *     const map = cbor.value as CborMap;
 *     const name = extractCbor(map.get('name')!) as string;
 *     const age = extractCbor(map.get('age')!) as number;
 *     return new Person(name, age);
 *   }
 *
 *   tryFromCbor(cbor: Cbor): Person | Error {
 *     try {
 *       return this.fromCbor(cbor);
 *     } catch (error) {
 *       return error instanceof Error ? error : new Error(String(error));
 *     }
 *   }
 * }
 * ```
 */
export interface CBORCodable<T> extends CBOREncodable, CBORDecodable<T> {}

/**
 * Default implementation of toCborData() for CBOREncodable types.
 *
 * Encodes the result of toCbor() to bytes.
 *
 * @param obj - Object implementing CBOREncodable
 * @returns CBOR-encoded bytes
 *
 * @example
 * ```typescript
 * class MyType implements CBOREncodable {
 *   toCbor(): Cbor { ... }
 *   toCborData = () => defaultToCborData(this);
 * }
 * ```
 */
export function defaultToCborData(obj: CBOREncodable): Uint8Array {
  return encodeCbor(obj.toCbor());
}

/**
 * Default implementation of tryFromCbor() for CBORDecodable types.
 *
 * Wraps fromCbor() in try-catch and returns Error instead of throwing.
 *
 * @param obj - Object implementing CBORDecodable
 * @param cbor - CBOR value to decode
 * @returns Decoded instance or Error
 *
 * @example
 * ```typescript
 * class MyType implements CBORDecodable<MyType> {
 *   fromCbor(cbor: Cbor): MyType { ... }
 *   tryFromCbor = (cbor: Cbor) => defaultTryFromCbor(this, cbor);
 * }
 * ```
 */
export function defaultTryFromCbor<T>(
  obj: CBORDecodable<T>,
  cbor: Cbor
): T | Error {
  try {
    return obj.fromCbor(cbor);
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Type guard to check if an object implements CBOREncodable.
 *
 * @param obj - Object to check
 * @returns True if object implements CBOREncodable
 *
 * @example
 * ```typescript
 * if (isCBOREncodable(myObj)) {
 *   const cbor = myObj.toCbor();
 *   const bytes = myObj.toCborData();
 * }
 * ```
 */
export function isCBOREncodable(obj: any): obj is CBOREncodable {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'toCbor' in obj &&
    typeof obj.toCbor === 'function' &&
    'toCborData' in obj &&
    typeof obj.toCborData === 'function'
  );
}

/**
 * Type guard to check if an object implements CBORDecodable.
 *
 * @param obj - Object to check
 * @returns True if object implements CBORDecodable
 *
 * @example
 * ```typescript
 * if (isCBORDecodable(MyClass.prototype)) {
 *   const instance = MyClass.prototype.fromCbor(someCbor);
 * }
 * ```
 */
export function isCBORDecodable<T>(obj: any): obj is CBORDecodable<T> {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'fromCbor' in obj &&
    typeof obj.fromCbor === 'function' &&
    'tryFromCbor' in obj &&
    typeof obj.tryFromCbor === 'function'
  );
}

/**
 * Type guard to check if an object implements CBORCodable.
 *
 * @param obj - Object to check
 * @returns True if object implements both CBOREncodable and CBORDecodable
 *
 * @example
 * ```typescript
 * if (isCBORCodable(myObj)) {
 *   const cbor = myObj.toCbor();
 *   const copy = myObj.fromCbor(cbor);
 * }
 * ```
 */
export function isCBORCodable<T>(obj: any): obj is CBORCodable<T> {
  return isCBOREncodable(obj) && isCBORDecodable<T>(obj);
}
