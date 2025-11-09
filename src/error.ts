/**
 * Enhanced error types for CBOR operations.
 *
 * Provides structured error types with detailed context for better
 * debugging and error handling.
 *
 * @module error
 */

import { MajorType } from './cbor';

/**
 * Base class for all CBOR-related errors.
 *
 * @example
 * ```typescript
 * try {
 *   // CBOR operation
 * } catch (error) {
 *   if (error instanceof CBORError) {
 *     console.error('CBOR Error:', error.message);
 *     console.error('Context:', error.context);
 *   }
 * }
 * ```
 */
export class CBORError extends Error {
  /**
   * Additional context about the error.
   */
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'CBORError';
    this.context = context;
    Object.setPrototypeOf(this, CBORError.prototype);
  }
}

/**
 * Error thrown when CBOR encoding fails.
 *
 * @example
 * ```typescript
 * throw new CBOREncodingError('Cannot encode circular reference', {
 *   value: someValue
 * });
 * ```
 */
export class CBOREncodingError extends CBORError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBOREncodingError';
    Object.setPrototypeOf(this, CBOREncodingError.prototype);
  }
}

/**
 * Error thrown when CBOR decoding fails.
 *
 * @example
 * ```typescript
 * throw new CBORDecodingError('Unexpected end of input', {
 *   position: 42,
 *   expected: 'major type',
 *   data: buffer
 * });
 * ```
 */
export class CBORDecodingError extends CBORError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBORDecodingError';
    Object.setPrototypeOf(this, CBORDecodingError.prototype);
  }
}

/**
 * Error thrown when CBOR type doesn't match expected type.
 *
 * @example
 * ```typescript
 * throw new CBORTypeError('Expected text string', {
 *   expected: MajorType.Text,
 *   actual: MajorType.Unsigned,
 *   value: cbor
 * });
 * ```
 */
export class CBORTypeError extends CBORError {
  public readonly expected?: MajorType | MajorType[];
  public readonly actual?: MajorType;

  constructor(
    message: string,
    expected?: MajorType | MajorType[],
    actual?: MajorType,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.name = 'CBORTypeError';
    this.expected = expected;
    this.actual = actual;
    Object.setPrototypeOf(this, CBORTypeError.prototype);
  }
}

/**
 * Error thrown when tag doesn't match expected tag.
 *
 * @example
 * ```typescript
 * throw new CBORTagError('Expected date tag', {
 *   expected: 1,
 *   actual: 42,
 *   content: cbor
 * });
 * ```
 */
export class CBORTagError extends CBORError {
  public readonly expectedTag?: number | bigint;
  public readonly actualTag?: number | bigint;

  constructor(
    message: string,
    expectedTag?: number | bigint,
    actualTag?: number | bigint,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.name = 'CBORTagError';
    this.expectedTag = expectedTag;
    this.actualTag = actualTag;
    Object.setPrototypeOf(this, CBORTagError.prototype);
  }
}

/**
 * Error thrown when CBOR validation fails.
 *
 * @example
 * ```typescript
 * throw new CBORValidationError('Map keys must be in ascending order', {
 *   previousKey: key1,
 *   currentKey: key2
 * });
 * ```
 */
export class CBORValidationError extends CBORError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBORValidationError';
    Object.setPrototypeOf(this, CBORValidationError.prototype);
  }
}

/**
 * Error thrown when CBOR structure is invalid.
 *
 * @example
 * ```typescript
 * throw new CBORStructureError('Array length mismatch', {
 *   expectedLength: 3,
 *   actualLength: 2
 * });
 * ```
 */
export class CBORStructureError extends CBORError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBORStructureError';
    Object.setPrototypeOf(this, CBORStructureError.prototype);
  }
}

/**
 * Error thrown when CBOR value is out of valid range.
 *
 * @example
 * ```typescript
 * throw new CBORRangeError('Integer too large for JavaScript number', {
 *   value: bigValue,
 *   max: Number.MAX_SAFE_INTEGER
 * });
 * ```
 */
export class CBORRangeError extends CBORError {
  public readonly min?: number | bigint;
  public readonly max?: number | bigint;
  public readonly value?: number | bigint;

  constructor(
    message: string,
    value?: number | bigint,
    min?: number | bigint,
    max?: number | bigint,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.name = 'CBORRangeError';
    this.value = value;
    this.min = min;
    this.max = max;
    Object.setPrototypeOf(this, CBORRangeError.prototype);
  }
}

/**
 * Error thrown when required CBOR field is missing.
 *
 * @example
 * ```typescript
 * throw new CBORMissingFieldError('Required field "name" not found', {
 *   field: 'name',
 *   available: ['age', 'email']
 * });
 * ```
 */
export class CBORMissingFieldError extends CBORError {
  public readonly field?: string;

  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBORMissingFieldError';
    this.field = field;
    Object.setPrototypeOf(this, CBORMissingFieldError.prototype);
  }
}

/**
 * Error thrown when array index is out of bounds.
 *
 * @example
 * ```typescript
 * throw new CBORIndexError('Array index out of bounds', {
 *   index: 10,
 *   length: 5
 * });
 * ```
 */
export class CBORIndexError extends CBORError {
  public readonly index?: number;
  public readonly length?: number;

  constructor(
    message: string,
    index?: number,
    length?: number,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.name = 'CBORIndexError';
    this.index = index;
    this.length = length;
    Object.setPrototypeOf(this, CBORIndexError.prototype);
  }
}

/**
 * Error thrown when map key is not found.
 *
 * @example
 * ```typescript
 * throw new CBORKeyError('Key not found in map', {
 *   key: 'username',
 *   availableKeys: ['name', 'age']
 * });
 * ```
 */
export class CBORKeyError extends CBORError {
  public readonly key?: any;

  constructor(message: string, key?: any, context?: Record<string, any>) {
    super(message, context);
    this.name = 'CBORKeyError';
    this.key = key;
    Object.setPrototypeOf(this, CBORKeyError.prototype);
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a type error with formatted message.
 *
 * @param expected - Expected type(s)
 * @param actual - Actual type
 * @param context - Additional context
 * @returns CBORTypeError instance
 *
 * @example
 * ```typescript
 * throw createTypeError(MajorType.Text, cbor.type);
 * throw createTypeError([MajorType.Text, MajorType.ByteString], cbor.type);
 * ```
 */
export function createTypeError(
  expected: MajorType | MajorType[],
  actual: MajorType,
  context?: Record<string, any>
): CBORTypeError {
  const expectedStr = Array.isArray(expected)
    ? expected.map(majorTypeToString).join(' or ')
    : majorTypeToString(expected);
  const actualStr = majorTypeToString(actual);
  return new CBORTypeError(
    `Expected ${expectedStr}, got ${actualStr}`,
    expected,
    actual,
    context
  );
}

/**
 * Create a tag error with formatted message.
 *
 * @param expected - Expected tag value
 * @param actual - Actual tag value (if any)
 * @param context - Additional context
 * @returns CBORTagError instance
 *
 * @example
 * ```typescript
 * throw createTagError(1, 42);
 * ```
 */
export function createTagError(
  expected: number | bigint,
  actual?: number | bigint,
  context?: Record<string, any>
): CBORTagError {
  const message = actual !== undefined
    ? `Expected tag ${expected}, got tag ${actual}`
    : `Expected tag ${expected}`;
  return new CBORTagError(message, expected, actual, context);
}

/**
 * Create a missing field error with formatted message.
 *
 * @param field - Missing field name
 * @param context - Additional context
 * @returns CBORMissingFieldError instance
 *
 * @example
 * ```typescript
 * throw createMissingFieldError('username');
 * ```
 */
export function createMissingFieldError(
  field: string,
  context?: Record<string, any>
): CBORMissingFieldError {
  return new CBORMissingFieldError(
    `Required field "${field}" not found`,
    field,
    context
  );
}

/**
 * Create an index error with formatted message.
 *
 * @param index - Array index
 * @param length - Array length
 * @param context - Additional context
 * @returns CBORIndexError instance
 *
 * @example
 * ```typescript
 * throw createIndexError(10, 5);
 * ```
 */
export function createIndexError(
  index: number,
  length: number,
  context?: Record<string, any>
): CBORIndexError {
  return new CBORIndexError(
    `Array index ${index} out of bounds (length: ${length})`,
    index,
    length,
    context
  );
}

/**
 * Create a key error with formatted message.
 *
 * @param key - Map key
 * @param context - Additional context
 * @returns CBORKeyError instance
 *
 * @example
 * ```typescript
 * throw createKeyError('username');
 * ```
 */
export function createKeyError(
  key: any,
  context?: Record<string, any>
): CBORKeyError {
  return new CBORKeyError(`Key "${key}" not found in map`, key, context);
}

/**
 * Create a range error with formatted message.
 *
 * @param value - Out-of-range value
 * @param min - Minimum valid value (optional)
 * @param max - Maximum valid value (optional)
 * @param context - Additional context
 * @returns CBORRangeError instance
 *
 * @example
 * ```typescript
 * throw createRangeError(value, 0, 100);
 * ```
 */
export function createRangeError(
  value: number | bigint,
  min?: number | bigint,
  max?: number | bigint,
  context?: Record<string, any>
): CBORRangeError {
  let message = `Value ${value} out of range`;
  if (min !== undefined && max !== undefined) {
    message = `Value ${value} out of range [${min}, ${max}]`;
  } else if (min !== undefined) {
    message = `Value ${value} below minimum ${min}`;
  } else if (max !== undefined) {
    message = `Value ${value} above maximum ${max}`;
  }
  return new CBORRangeError(message, value, min, max, context);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert MajorType enum to human-readable string.
 *
 * @param type - Major type enum value
 * @returns Human-readable type name
 *
 * @internal
 */
function majorTypeToString(type: MajorType): string {
  switch (type) {
    case MajorType.Unsigned:
      return 'unsigned integer';
    case MajorType.Negative:
      return 'negative integer';
    case MajorType.ByteString:
      return 'byte string';
    case MajorType.Text:
      return 'text string';
    case MajorType.Array:
      return 'array';
    case MajorType.Map:
      return 'map';
    case MajorType.Tagged:
      return 'tagged value';
    case MajorType.Simple:
      return 'simple value';
    default:
      return `unknown type ${type}`;
  }
}

/**
 * Check if error is a CBOR error.
 *
 * @param error - Error to check
 * @returns True if error is CBORError instance
 *
 * @example
 * ```typescript
 * if (isCBORError(error)) {
 *   console.log('CBOR Error:', error.message);
 * }
 * ```
 */
export function isCBORError(error: any): error is CBORError {
  return error instanceof CBORError;
}

/**
 * Check if error is a specific CBOR error type.
 *
 * @param error - Error to check
 * @param type - Error class to check against
 * @returns True if error is instance of type
 *
 * @example
 * ```typescript
 * if (isCBORErrorType(error, CBORTypeError)) {
 *   console.log('Expected:', error.expected);
 *   console.log('Actual:', error.actual);
 * }
 * ```
 */
export function isCBORErrorType<T extends CBORError>(
  error: any,
  type: new (...args: any[]) => T
): error is T {
  return error instanceof type;
}
