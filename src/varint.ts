import { type CborNumber, isCborNumber, type MajorType } from "./cbor";
import { hasFractionalPart } from "./float";

function typeBits(t: MajorType): number {
  return t << 5;
}

export function encodeVarInt(value: CborNumber, majorType: MajorType): Uint8Array {
  // throw an error if the value is negative.
  if (value < 0) {
    throw new Error("Value out of range");
  }
  // throw an error if the value is a number with a fractional part.
  if (typeof value === 'number' && hasFractionalPart(value)) {
    throw new Error("Value out of range");
  }
  const type = typeBits(majorType);
  // If the value is a `number` or a `bigint` that can be represented as a `number`, convert it to a `number`.
  if (isCborNumber(value) && value <= Number.MAX_SAFE_INTEGER) {
    value = Number(value);
    if (value <= 23) {
      return new Uint8Array([value | type]);
    } else if (value <= 0xFF) { // Fits in UInt8
      return new Uint8Array([0x18 | type, value]);
    } else if (value <= 0xFFFF) { // Fits in UInt16
      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, 0x19 | type);
      view.setUint16(1, value);
      return new Uint8Array(buffer);
    } else if (value <= 0xFFFFFFFF) { // Fits in UInt32
      const buffer = new ArrayBuffer(5);
      const view = new DataView(buffer);
      view.setUint8(0, 0x1a | type);
      view.setUint32(1, value);
      return new Uint8Array(buffer);
    } else { // Fits in MAX_SAFE_INTEGER
      const buffer = new ArrayBuffer(9);
      const view = new DataView(buffer);
      view.setUint8(0, 0x1b | type);
      view.setBigUint64(1, BigInt(value));
      return new Uint8Array(buffer);
    }
  } else {
    value = BigInt(value);
    const bitsNeeded = Math.ceil(Math.log2(Number(value)) / 8) * 8;
    if (bitsNeeded > 64) {
      throw new Error("Value out of range");
    }
    const length = Math.ceil(bitsNeeded / 8) + 1;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    let i = length - 1;
    while (value > 0) {
      view.setUint8(i, Number(value & 0xFFn));
      value >>= 8n;
      i--;
    }
    view.setUint8(0, 0x1b | type);
    return new Uint8Array(buffer);
  }
}

export function decodeVarIntData(dataView: DataView, offset: number): { majorType: MajorType, value: CborNumber, offset: number } {
  const initialByte = dataView.getUint8(offset);
  const majorType = initialByte >> 5;
  const additionalInfo = initialByte & 0x1f;
  let value: CborNumber;
  offset += 1;
  switch (additionalInfo) {
    case 24: // 1-byte additional info
      value = dataView.getUint8(offset);
      offset += 1;
      break;
    case 25: // 2-byte additional info
      value = (dataView.getUint8(offset) << 8 | dataView.getUint8(offset + 1)) >>> 0;
      offset += 2;
      break;
    case 26: // 4-byte additional info
      value = (dataView.getUint8(offset) << 24 | dataView.getUint8(offset + 1) << 16 | dataView.getUint8(offset + 2) << 8 | dataView.getUint8(offset + 3)) >>> 0;
      offset += 4;
      break;
    case 27: // 8-byte additional info
      value = getUint64(dataView, offset, false);
      if (value <= Number.MAX_SAFE_INTEGER) {
        value = Number(value);
      }
      offset += 8;
      break;
    default: // no additional info
      value = additionalInfo;
      break;
  }
  return { majorType, value, offset };
}

export function decodeVarInt(data: Uint8Array): { majorType: MajorType, value: CborNumber, offset: number } {
  return decodeVarIntData(new DataView(data.buffer, data.byteOffset, data.byteLength), 0);
}

function getUint64(view: DataView, byteOffset: number, littleEndian: boolean): bigint {
  const lowWord = littleEndian ? view.getUint32(byteOffset, true) : view.getUint32(byteOffset + 4, false);
  const highWord = littleEndian ? view.getUint32(byteOffset + 4, true) : view.getUint32(byteOffset, false);
  return (BigInt(highWord) << BigInt(32)) + BigInt(lowWord);
}

export function encodeBitPattern(majorType: MajorType, value: Uint8Array): Uint8Array {
  const type = typeBits(majorType);
  const buffer = new ArrayBuffer(value.length + 1);
  const view = new DataView(buffer);
  switch (value.length) {
    case 2: {
      const b0 = value[0];
      const b1 = value[1];
      if (b0 === undefined || b1 === undefined) {
        throw new Error('Invalid varint data');
      }
      view.setUint8(0, 0x19 | type);
      view.setUint16(1, b0 << 8 | b1);
      break;
    }
    case 4: {
      const b0 = value[0];
      const b1 = value[1];
      const b2 = value[2];
      const b3 = value[3];
      if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
        throw new Error('Invalid varint data');
      }
      view.setUint8(0, 0x1a | type);
      view.setUint32(1, b0 << 24 | b1 << 16 | b2 << 8 | b3);
      break;
    }
    case 8: {
      const b0 = value[0];
      const b1 = value[1];
      const b2 = value[2];
      const b3 = value[3];
      const b4 = value[4];
      const b5 = value[5];
      const b6 = value[6];
      const b7 = value[7];
      if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined ||
          b4 === undefined || b5 === undefined || b6 === undefined || b7 === undefined) {
        throw new Error('Invalid varint data');
      }
      view.setUint8(0, 0x1b | type);
      view.setBigUint64(1,
        BigInt(b0) << 56n |
        BigInt(b1) << 48n |
        BigInt(b2) << 40n |
        BigInt(b3) << 32n |
        BigInt(b4) << 24n |
        BigInt(b5) << 16n |
        BigInt(b6) << 8n |
        BigInt(b7)
      );
      break;
    }
  }
  return new Uint8Array(buffer);
}

export function decodeBitPattern(data: Uint8Array): { majorType: MajorType, bitPattern: Uint8Array} {
  const initialByte = data[0];
  if (initialByte === undefined) {
    throw new Error('Empty data array');
  }
  const majorType = initialByte >> 5;
  const additionalInfo = initialByte & 0x1f;
  let length: number;
  switch (additionalInfo) {
    case 0x19: // 2-byte additional info
      length = 2;
      break;
    case 0x1a: // 4-byte additional info
      length = 4;
      break;
    case 0x1b: // 8-byte additional info
      length = 8;
      break;
    default:
      throw new Error("Invalid bit pattern");
  }
  return { majorType: majorType, bitPattern: data.subarray(1, 1 + length) };
}
