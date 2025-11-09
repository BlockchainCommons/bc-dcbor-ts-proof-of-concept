/**
 * Tests for enhanced CBOR error types.
 */

import { describe, test, expect } from '@jest/globals';
import { MajorType } from './cbor';
import {
  CBORError,
  CBOREncodingError,
  CBORDecodingError,
  CBORTypeError,
  CBORTagError,
  CBORValidationError,
  CBORStructureError,
  CBORRangeError,
  CBORMissingFieldError,
  CBORIndexError,
  CBORKeyError,
  createTypeError,
  createTagError,
  createMissingFieldError,
  createIndexError,
  createKeyError,
  createRangeError,
  isCBORError,
  isCBORErrorType,
} from './error';

// ============================================================================
// Base Error Tests
// ============================================================================

describe('CBORError', () => {
  test('creates basic error', () => {
    const error = new CBORError('test message');
    expect(error.message).toBe('test message');
    expect(error.name).toBe('CBORError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CBORError);
  });

  test('includes context', () => {
    const context = { key: 'value', number: 42 };
    const error = new CBORError('test', context);
    expect(error.context).toEqual(context);
  });

  test('works without context', () => {
    const error = new CBORError('test');
    expect(error.context).toBeUndefined();
  });
});

// ============================================================================
// Specific Error Type Tests
// ============================================================================

describe('CBOREncodingError', () => {
  test('creates encoding error', () => {
    const error = new CBOREncodingError('Cannot encode circular reference');
    expect(error.message).toContain('circular reference');
    expect(error.name).toBe('CBOREncodingError');
    expect(error).toBeInstanceOf(CBORError);
    expect(error).toBeInstanceOf(CBOREncodingError);
  });

  test('includes encoding context', () => {
    const error = new CBOREncodingError('Encoding failed', { value: 'test' });
    expect(error.context?.value).toBe('test');
  });
});

describe('CBORDecodingError', () => {
  test('creates decoding error', () => {
    const error = new CBORDecodingError('Unexpected end of input');
    expect(error.message).toContain('Unexpected end');
    expect(error.name).toBe('CBORDecodingError');
    expect(error).toBeInstanceOf(CBORError);
    expect(error).toBeInstanceOf(CBORDecodingError);
  });

  test('includes decoding position', () => {
    const error = new CBORDecodingError('Invalid byte', { position: 42 });
    expect(error.context?.position).toBe(42);
  });
});

describe('CBORTypeError', () => {
  test('creates type error with single expected type', () => {
    const error = new CBORTypeError(
      'Type mismatch',
      MajorType.Text,
      MajorType.Unsigned
    );
    expect(error.name).toBe('CBORTypeError');
    expect(error.expected).toBe(MajorType.Text);
    expect(error.actual).toBe(MajorType.Unsigned);
  });

  test('creates type error with multiple expected types', () => {
    const expected = [MajorType.Text, MajorType.ByteString];
    const error = new CBORTypeError('Type mismatch', expected, MajorType.Array);
    expect(error.expected).toEqual(expected);
    expect(error.actual).toBe(MajorType.Array);
  });

  test('includes type context', () => {
    const error = new CBORTypeError(
      'Wrong type',
      MajorType.Map,
      MajorType.Array,
      { path: 'user.address' }
    );
    expect(error.context?.path).toBe('user.address');
  });
});

describe('CBORTagError', () => {
  test('creates tag error', () => {
    const error = new CBORTagError('Wrong tag', 1, 42);
    expect(error.name).toBe('CBORTagError');
    expect(error.expectedTag).toBe(1);
    expect(error.actualTag).toBe(42);
  });

  test('works without actual tag', () => {
    const error = new CBORTagError('Missing tag', 1);
    expect(error.expectedTag).toBe(1);
    expect(error.actualTag).toBeUndefined();
  });

  test('includes tag context', () => {
    const error = new CBORTagError('Tag error', 1, 2, { field: 'date' });
    expect(error.context?.field).toBe('date');
  });
});

describe('CBORValidationError', () => {
  test('creates validation error', () => {
    const error = new CBORValidationError('Invalid map ordering');
    expect(error.name).toBe('CBORValidationError');
    expect(error.message).toContain('ordering');
  });

  test('includes validation context', () => {
    const error = new CBORValidationError('Duplicate key', {
      key: 'username',
      index: 5,
    });
    expect(error.context?.key).toBe('username');
    expect(error.context?.index).toBe(5);
  });
});

describe('CBORStructureError', () => {
  test('creates structure error', () => {
    const error = new CBORStructureError('Invalid structure');
    expect(error.name).toBe('CBORStructureError');
  });

  test('includes structure context', () => {
    const error = new CBORStructureError('Length mismatch', {
      expected: 3,
      actual: 2,
    });
    expect(error.context?.expected).toBe(3);
    expect(error.context?.actual).toBe(2);
  });
});

describe('CBORRangeError', () => {
  test('creates range error with value', () => {
    const error = new CBORRangeError('Out of range', 1000);
    expect(error.name).toBe('CBORRangeError');
    expect(error.value).toBe(1000);
  });

  test('includes min and max', () => {
    const error = new CBORRangeError('Out of range', 150, 0, 100);
    expect(error.value).toBe(150);
    expect(error.min).toBe(0);
    expect(error.max).toBe(100);
  });

  test('works with bigint', () => {
    const error = new CBORRangeError('Too large', 9999999999999999n);
    expect(error.value).toBe(9999999999999999n);
  });
});

describe('CBORMissingFieldError', () => {
  test('creates missing field error', () => {
    const error = new CBORMissingFieldError('Field not found', 'username');
    expect(error.name).toBe('CBORMissingFieldError');
    expect(error.field).toBe('username');
  });

  test('includes available fields', () => {
    const error = new CBORMissingFieldError('Missing field', 'email', {
      available: ['name', 'age'],
    });
    expect(error.context?.available).toEqual(['name', 'age']);
  });
});

describe('CBORIndexError', () => {
  test('creates index error', () => {
    const error = new CBORIndexError('Index out of bounds', 10, 5);
    expect(error.name).toBe('CBORIndexError');
    expect(error.index).toBe(10);
    expect(error.length).toBe(5);
  });

  test('includes array context', () => {
    const error = new CBORIndexError('Bad index', 3, 2, { path: 'items[3]' });
    expect(error.context?.path).toBe('items[3]');
  });
});

describe('CBORKeyError', () => {
  test('creates key error', () => {
    const error = new CBORKeyError('Key not found', 'username');
    expect(error.name).toBe('CBORKeyError');
    expect(error.key).toBe('username');
  });

  test('works with numeric keys', () => {
    const error = new CBORKeyError('Missing key', 42);
    expect(error.key).toBe(42);
  });
});

// ============================================================================
// Error Factory Function Tests
// ============================================================================

describe('createTypeError', () => {
  test('creates error with single expected type', () => {
    const error = createTypeError(MajorType.Text, MajorType.Unsigned);
    expect(error.message).toContain('text string');
    expect(error.message).toContain('unsigned integer');
    expect(error.expected).toBe(MajorType.Text);
    expect(error.actual).toBe(MajorType.Unsigned);
  });

  test('creates error with multiple expected types', () => {
    const error = createTypeError(
      [MajorType.Text, MajorType.ByteString],
      MajorType.Unsigned
    );
    expect(error.message).toContain('text string or byte string');
    expect(error.expected).toEqual([MajorType.Text, MajorType.ByteString]);
  });

  test('includes context', () => {
    const error = createTypeError(MajorType.Map, MajorType.Array, {
      path: 'data',
    });
    expect(error.context?.path).toBe('data');
  });
});

describe('createTagError', () => {
  test('creates tag error with actual tag', () => {
    const error = createTagError(1, 42);
    expect(error.message).toContain('Expected tag 1');
    expect(error.message).toContain('got tag 42');
    expect(error.expectedTag).toBe(1);
    expect(error.actualTag).toBe(42);
  });

  test('creates tag error without actual tag', () => {
    const error = createTagError(1);
    expect(error.message).toContain('Expected tag 1');
    expect(error.message).not.toContain('got tag');
    expect(error.actualTag).toBeUndefined();
  });

  test('works with bigint tags', () => {
    const error = createTagError(12345678901234n, 98765432109876n);
    expect(error.expectedTag).toBe(12345678901234n);
    expect(error.actualTag).toBe(98765432109876n);
  });
});

describe('createMissingFieldError', () => {
  test('creates missing field error', () => {
    const error = createMissingFieldError('username');
    expect(error.message).toContain('username');
    expect(error.message).toContain('not found');
    expect(error.field).toBe('username');
  });

  test('includes context', () => {
    const error = createMissingFieldError('email', {
      available: ['name', 'age'],
    });
    expect(error.context?.available).toEqual(['name', 'age']);
  });
});

describe('createIndexError', () => {
  test('creates index error', () => {
    const error = createIndexError(10, 5);
    expect(error.message).toContain('10');
    expect(error.message).toContain('5');
    expect(error.message).toContain('out of bounds');
    expect(error.index).toBe(10);
    expect(error.length).toBe(5);
  });

  test('includes context', () => {
    const error = createIndexError(3, 2, { operation: 'get' });
    expect(error.context?.operation).toBe('get');
  });
});

describe('createKeyError', () => {
  test('creates key error', () => {
    const error = createKeyError('username');
    expect(error.message).toContain('username');
    expect(error.message).toContain('not found');
    expect(error.key).toBe('username');
  });

  test('works with complex keys', () => {
    const error = createKeyError({ id: 123 });
    expect(error.key).toEqual({ id: 123 });
  });
});

describe('createRangeError', () => {
  test('creates range error with min and max', () => {
    const error = createRangeError(150, 0, 100);
    expect(error.message).toContain('150');
    expect(error.message).toContain('[0, 100]');
    expect(error.value).toBe(150);
    expect(error.min).toBe(0);
    expect(error.max).toBe(100);
  });

  test('creates range error with only min', () => {
    const error = createRangeError(-5, 0);
    expect(error.message).toContain('below minimum 0');
    expect(error.min).toBe(0);
    expect(error.max).toBeUndefined();
  });

  test('creates range error with only max', () => {
    const error = createRangeError(1000, undefined, 999);
    expect(error.message).toContain('above maximum 999');
    expect(error.min).toBeUndefined();
    expect(error.max).toBe(999);
  });

  test('creates range error with just value', () => {
    const error = createRangeError(42);
    expect(error.message).toContain('out of range');
    expect(error.value).toBe(42);
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('isCBORError', () => {
  test('detects CBOR errors', () => {
    expect(isCBORError(new CBORError('test'))).toBe(true);
    expect(isCBORError(new CBORTypeError('test'))).toBe(true);
    expect(isCBORError(new CBOREncodingError('test'))).toBe(true);
  });

  test('rejects non-CBOR errors', () => {
    expect(isCBORError(new Error('test'))).toBe(false);
    expect(isCBORError(new TypeError('test'))).toBe(false);
    expect(isCBORError('not an error')).toBe(false);
    expect(isCBORError(null)).toBe(false);
  });
});

describe('isCBORErrorType', () => {
  test('detects specific error types', () => {
    const typeError = new CBORTypeError('test');
    const encodingError = new CBOREncodingError('test');

    expect(isCBORErrorType(typeError, CBORTypeError)).toBe(true);
    expect(isCBORErrorType(typeError, CBOREncodingError)).toBe(false);
    expect(isCBORErrorType(encodingError, CBOREncodingError)).toBe(true);
    expect(isCBORErrorType(encodingError, CBORTypeError)).toBe(false);
  });

  test('provides type narrowing', () => {
    const error: CBORError = new CBORTypeError(
      'test',
      MajorType.Text,
      MajorType.Unsigned
    );

    if (isCBORErrorType(error, CBORTypeError)) {
      expect(error.expected).toBe(MajorType.Text);
      expect(error.actual).toBe(MajorType.Unsigned);
    } else {
      throw new Error('Should have been CBORTypeError');
    }
  });
});

// ============================================================================
// Error Inheritance Tests
// ============================================================================

describe('Error Inheritance', () => {
  test('all CBOR errors extend CBORError', () => {
    expect(new CBOREncodingError('test')).toBeInstanceOf(CBORError);
    expect(new CBORDecodingError('test')).toBeInstanceOf(CBORError);
    expect(new CBORTypeError('test')).toBeInstanceOf(CBORError);
    expect(new CBORTagError('test')).toBeInstanceOf(CBORError);
    expect(new CBORValidationError('test')).toBeInstanceOf(CBORError);
    expect(new CBORStructureError('test')).toBeInstanceOf(CBORError);
    expect(new CBORRangeError('test')).toBeInstanceOf(CBORError);
    expect(new CBORMissingFieldError('test')).toBeInstanceOf(CBORError);
    expect(new CBORIndexError('test')).toBeInstanceOf(CBORError);
    expect(new CBORKeyError('test')).toBeInstanceOf(CBORError);
  });

  test('all CBOR errors extend Error', () => {
    expect(new CBORError('test')).toBeInstanceOf(Error);
    expect(new CBORTypeError('test')).toBeInstanceOf(Error);
    expect(new CBOREncodingError('test')).toBeInstanceOf(Error);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Error Usage Patterns', () => {
  test('try-catch with type checking', () => {
    try {
      throw createTypeError(MajorType.Text, MajorType.Unsigned);
    } catch (error) {
      expect(isCBORError(error)).toBe(true);
      if (isCBORErrorType(error, CBORTypeError)) {
        expect(error.expected).toBe(MajorType.Text);
        expect(error.actual).toBe(MajorType.Unsigned);
      }
    }
  });

  test('error with rich context', () => {
    const error = new CBORValidationError('Map keys not sorted', {
      previousKey: 'b',
      currentKey: 'a',
      index: 5,
      path: 'data.users.map',
    });

    expect(error.context?.previousKey).toBe('b');
    expect(error.context?.currentKey).toBe('a');
    expect(error.context?.index).toBe(5);
    expect(error.context?.path).toBe('data.users.map');
  });

  test('chaining error information', () => {
    const error = createMissingFieldError('username', {
      objectType: 'User',
      available: ['name', 'email', 'age'],
      source: 'API response',
    });

    expect(error.field).toBe('username');
    expect(error.context?.objectType).toBe('User');
    expect(error.context?.available).toHaveLength(3);
    expect(error.context?.source).toBe('API response');
  });
});
