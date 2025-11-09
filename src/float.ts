import * as byteData from "byte-data";

export function hasFractionalPart(n: number): boolean {
  return n != Math.floor(n);
}

export function numberToBinary64(n: number): Uint8Array {
  var data = new Uint8Array(8);
  byteData.packTo(n, { bits: 64, fp: true, be: true }, data);
  return data;
}

export function binary64ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 64, fp: true, be: true });
}

export function numberToBinary32(n: number): Uint8Array {
  var data = new Uint8Array(4);
  byteData.packTo(n, { bits: 32, fp: true, be: true }, data);
  return data;
}

export function binary32ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 32, fp: true, be: true });
}

export function numberToBinary16(n: number): Uint8Array {
  var data = new Uint8Array(2);
  byteData.packTo(n, { bits: 16, fp: true, be: true }, data);
  return data;
}

export function binary16ToNumber(data: Uint8Array): number {
  return byteData.unpack(data, { bits: 16, fp: true, be: true });
}

/**
 * Encode an f64 to CBOR bytes.
 * Matches Rust's f64_cbor_data function.
 */
export function f64CborData(n: number): Uint8Array {
  // Check for numeric reduction to integer first
  // (implementation will be in encode.ts to avoid circular deps)
  return numberToBinary(n);
}

export function numberToBinary(n: number): Uint8Array {
  if (isNaN(n)) {
    return new Uint8Array([0x7e, 0x00]);
  }
  const n32 = numberToBinary32(n);
  const f32 = binary32ToNumber(n32);
  if (f32 == n) {
    const n16 = numberToBinary16(n);
    const f16 = binary16ToNumber(n16);
    if (f16 == n) {
      return n16;
    }
    return n32;
  }
  return numberToBinary64(n);
}

export function binaryToNumber(data: Uint8Array): number {
  if (data.length == 2) {
    return binary16ToNumber(data);
  }
  if (data.length == 4) {
    const f32 = binary32ToNumber(data);
    const n16 = numberToBinary16(f32);
    const f16 = binary16ToNumber(n16);
    if (f16 == f32) {
      throw new Error("Non-canonical 32-bit float");
    }
    return f32;
  }
  if (data.length == 8) {
    const f64 = binary64ToNumber(data);
    const n32 = numberToBinary32(f64);
    const f32 = binary32ToNumber(n32);
    if (f32 == f64) {
      throw new Error("Non-canonical 64-bit float");
    }
    return f64;
  }
  throw new Error("Invalid float length");
}
