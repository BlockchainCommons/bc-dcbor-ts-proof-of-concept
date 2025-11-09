/**
 * CBOR Simple Values (Major Type 7)
 *
 * Represents simple values including booleans, null, and floating point numbers.
 * Matches the Rust implementation in bc-dcbor-rust/src/simple.rs
 */

/**
 * Simple value enum matching Rust's Simple type.
 *
 * Per Section 2.4 of the dCBOR specification, only these specific simple
 * values are valid in dCBOR. All other major type 7 values (such as undefined
 * or other simple values) are invalid and will be rejected by dCBOR decoders.
 *
 * When encoding floating point values, dCBOR follows specific numeric
 * reduction rules detailed in Section 2.3 of the dCBOR specification:
 * - Integral floating point values must be reduced to integers when possible
 * - NaN values must be normalized to the canonical form `f97e00`
 */
export enum SimpleValue {
  /** The boolean value `false`. Encoded as `0xf4` (value 20 with major type 7) */
  False = 0x14,

  /** The boolean value `true`. Encoded as `0xf5` (value 21 with major type 7) */
  True = 0x15,

  /** The value representing `null`. Encoded as `0xf6` (value 22 with major type 7) */
  Null = 0x16,
}

/**
 * Type representing all possible Simple values:
 * - Boolean values (False, True, Null) as SimpleValue enum
 * - Floating point numbers as { float: number }
 * - Other simple values as raw numbers (for compatibility, though not all are valid in dCBOR)
 */
export type Simple = SimpleValue | { float: number } | number;

/**
 * Type guard to check if a value is a SimpleValue enum member.
 */
export function isSimpleValue(value: any): value is SimpleValue {
  return value === SimpleValue.False || value === SimpleValue.True || value === SimpleValue.Null;
}

/**
 * Type guard to check if a Simple is a float.
 */
export function isSimpleFloat(simple: Simple): simple is { float: number } {
  return typeof simple === 'object' && 'float' in simple && typeof simple.float === 'number';
}

/**
 * Returns the standard name of the simple value as a string.
 *
 * For `False`, `True`, and `Null`, this returns their lowercase string
 * representation. For `Float` values, it returns their numeric representation.
 */
export function simpleName(simple: Simple): string {
  if (isSimpleValue(simple)) {
    switch (simple) {
      case SimpleValue.False:
        return 'false';
      case SimpleValue.True:
        return 'true';
      case SimpleValue.Null:
        return 'null';
    }
  } else if (isSimpleFloat(simple)) {
    const v = simple.float;
    if (isNaN(v)) {
      return 'NaN';
    } else if (!isFinite(v)) {
      return v > 0 ? 'Infinity' : '-Infinity';
    } else {
      return String(v);
    }
  }
  return String(simple);
}

/**
 * Checks if the simple value is a floating point number.
 */
export function isFloat(simple: Simple): boolean {
  return isSimpleFloat(simple);
}

/**
 * Checks if the simple value is NaN (Not a Number).
 */
export function isNaN(simple: Simple): boolean {
  return isSimpleFloat(simple) && Number.isNaN(simple.float);
}
