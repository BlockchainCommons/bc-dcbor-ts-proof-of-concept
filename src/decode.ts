import { Cbor, CborNumber, MajorType } from "./cbor";
import { areBytesEqual } from "./data-utils";
import { encodeCbor } from "./encode";
import { binary16ToNumber, binary32ToNumber, binary64ToNumber } from "./float";
import { CborMap } from "./map";

export function decodeCbor(data: Uint8Array): Cbor {
  const {cbor, len} = decodeCborInternal(new DataView(data.buffer, data.byteOffset, data.byteLength));
  const remaining = data.length - len;
  if (remaining !== 0) {
    throw new Error(`Unused data: ${remaining}`);
  }
  return cbor;
}

function parseHeader(header: number): { majorType: MajorType, headerValue: number } {
  const majorType = header >> 5;
  const headerValue = header & 31;
  return { majorType, headerValue };
}

function at(data: DataView, index: number): number {
  return data.getUint8(index);
}

function from(data: DataView, index: number): DataView {
  return new DataView(data.buffer, data.byteOffset + index);
}

function range(data: DataView, start: number, end: number): DataView {
  return new DataView(data.buffer, data.byteOffset + start, end - start);
}

function parseBytes(data: DataView, len: number): DataView {
  if (data.byteLength < len) {
    throw new Error("Underrun");
  }
  return range(data, 0, len);
}

function parseHeaderVarint(data: DataView): { majorType: MajorType, value: CborNumber, varIntLen: number } {
  if (data.byteLength < 1) {
    throw new Error("Underrun");
  }

  const { majorType, headerValue } = parseHeader(at(data, 0));
  const dataRemaining = data.byteLength - 1;
  let value: CborNumber;
  let varIntLen: number;
  if (headerValue <= 23) {
    value = headerValue;
    varIntLen = 1;
  } else if (headerValue === 24) {
    if (dataRemaining < 1) {
      throw new Error("Underrun");
    }
    value = at(data, 1);
    if (value < 24) {
      throw new Error("Non-canonical numeric");
    }
    varIntLen = 2;
  } else if (headerValue === 25) {
    if (dataRemaining < 2) {
      throw new Error("Underrun");
    }
    value = (at(data, 1) << 8 | at(data, 2)) >>> 0;
    if (value <= 0xFF) {
      throw new Error("Non-canonical numeric");
    }
    varIntLen = 3;
  } else if (headerValue === 26) {
    if (dataRemaining < 4) {
      throw new Error("Underrun");
    }
    value = (at(data, 1) << 24 | at(data, 2) << 16 | at(data, 3) << 8 | at(data, 4)) >>> 0;
    if (value <= 0xFFFF) {
      throw new Error("Non-canonical numeric");
    }
    varIntLen = 5;
  } else if (headerValue === 27) {
    if (dataRemaining < 8) {
      throw new Error("Underrun");
    }
    const a = BigInt(at(data, 1)) << 56n;
    const b = BigInt(at(data, 2)) << 48n;
    const c = BigInt(at(data, 3)) << 40n;
    const d = BigInt(at(data, 4)) << 32n;
    const e = BigInt(at(data, 5)) << 24n;
    const f = BigInt(at(data, 6)) << 16n;
    const g = BigInt(at(data, 7)) << 8n;
    const h = BigInt(at(data, 8));
    value = a | b | c | d | e | f | g | h;
    if (value <= Number.MAX_SAFE_INTEGER) {
      value = Number(value);
    }
    if (value <= 0xFFFFFFFF) {
      throw new Error("Non-canonical numeric");
    }
    varIntLen = 9;
  } else {
    throw new Error("Bad header value");
  }
  return { majorType, value, varIntLen };
}

function decodeCborInternal(data: DataView): { cbor: Cbor, len: number } {
  if (data.byteLength < 1) {
    throw new Error("Underrun");
  }
  const { majorType, value, varIntLen } = parseHeaderVarint(data);
  switch (majorType) {
    case MajorType.Unsigned: {
      const buf = new Uint8Array(data.buffer, data.byteOffset, varIntLen);
      checkCanonicalEncoding(value, buf);
      return { cbor: { isCbor: true, type: MajorType.Unsigned, value: value }, len: varIntLen };
    } case MajorType.Negative: {
      let v: CborNumber;
      if (typeof value === 'bigint') {
        if (value == 18446744073709551615n) {
          v = -9223372036854775808n;
        } else {
          v = -value - 1n;
        }
      } else {
        v = -value - 1;
      }
      const buf = new Uint8Array(data.buffer, data.byteOffset, varIntLen);
      checkCanonicalEncoding(v, buf);
      return { cbor: { isCbor: true, type: MajorType.Negative, value: v }, len: varIntLen };
    } case MajorType.ByteString: {
      const dataLen = value;
      if (typeof dataLen === 'bigint') {
        throw new Error("Value out of range")
      }
      const buf = parseBytes(from(data, varIntLen), dataLen);
      const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      return { cbor: { isCbor: true, type: MajorType.ByteString, value: bytes }, len: varIntLen + dataLen };
    } case MajorType.Text: {
      const textLen = value;
      if (typeof textLen === 'bigint') {
        throw new Error("Value out of range")
      }
      const textBuf = parseBytes(from(data, varIntLen), textLen);
      const text = new TextDecoder().decode(textBuf);
      // dCBOR requires all text strings to be in Unicode Normalization Form C (NFC)
      // Reject any strings that are not already in NFC form
      if (text.normalize('NFC') !== text) {
        throw new Error('Text string is not in Unicode Normalization Form C (NFC)');
      }
      return { cbor: { isCbor: true, type: MajorType.Text, value: text }, len: varIntLen + textLen };
    } case MajorType.Array: {
      let pos = varIntLen;
      const items: Cbor[] = [];
      for (let i = 0; i < value; i++) {
        const { cbor: item, len: itemLen } = decodeCborInternal(from(data, pos));
        items.push(item);
        pos += itemLen;
      }
      return { cbor: { isCbor: true, type: MajorType.Array, value: items }, len: pos };
    } case MajorType.Map: {
      let pos = varIntLen;
      const map = new CborMap();
      for (let i = 0; i < value; i++) {
        const { cbor: key, len: keyLen } = decodeCborInternal(from(data, pos));
        pos += keyLen;
        const { cbor: value, len: valueLen } = decodeCborInternal(from(data, pos));
        pos += valueLen;
        map.setNext(key, value);
      }
      return { cbor: { isCbor: true, type: MajorType.Map, value: map }, len: pos };
    } case MajorType.Tagged: {
      const { cbor: item, len: itemLen } = decodeCborInternal(from(data, varIntLen));
      return { cbor: { isCbor: true, type: MajorType.Tagged, tag: value, value: item }, len: varIntLen + itemLen };
    } case MajorType.Simple:
      switch (varIntLen) {
        case 3: {
          const f = binary16ToNumber(new Uint8Array(data.buffer, data.byteOffset + 1, 2));
          checkCanonicalEncoding(f, new Uint8Array(data.buffer, data.byteOffset, varIntLen));
          return { cbor: { isCbor: true, type: MajorType.Simple, value: { float: f } }, len: varIntLen };
        } case 5: {
          const f = binary32ToNumber(new Uint8Array(data.buffer, data.byteOffset + 1, 4));
          checkCanonicalEncoding(f, new Uint8Array(data.buffer, data.byteOffset, varIntLen));
          return { cbor: { isCbor: true, type: MajorType.Simple, value: { float: f } }, len: varIntLen };
        } case 9: {
          const f = binary64ToNumber(new Uint8Array(data.buffer, data.byteOffset + 1, 8));
          checkCanonicalEncoding(f, new Uint8Array(data.buffer, data.byteOffset, varIntLen));
          return { cbor: { isCbor: true, type: MajorType.Simple, value: { float: f } }, len: varIntLen };
        } default:
          switch (value) {
            case 20:
              return { cbor: Cbor.false, len: varIntLen };
            case 21:
              return { cbor: Cbor.true, len: varIntLen };
            case 22:
              return { cbor: Cbor.null, len: varIntLen };
            default:
              return { cbor: { isCbor: true, type: MajorType.Simple, value: value }, len: varIntLen };
          }
      }
  }
}

function checkCanonicalEncoding(f: any, buf: Uint8Array) {
  const buf2 = encodeCbor(f);
  if (!areBytesEqual(buf, buf2)) {
    throw new Error("Non-canonical encoding");
  }
}
