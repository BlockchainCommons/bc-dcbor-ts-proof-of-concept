import { Cbor, MajorType, CborTaggedType, CborArrayType, isCborNumber, CborNumber, isCbor, CborMapType } from "./cbor";
import { bytesToHex, concatBytes } from "./data-utils";
import { hasFractionalPart, numberToBinary } from "./float";
import { CborMap } from "./map";
import { SimpleValue, isSimpleValue, isSimpleFloat } from "./simple";
import { encodeBitPattern, encodeVarInt } from "./varint";

export interface ToCbor {
  toCbor(): Cbor;
}

export function cbor(value: Cbor | any): Cbor {
  if (isCbor(value)) {
    return value;
  }

  if (isCborNumber(value)) {
    if (typeof value === 'number' && isNaN(value)) {
      return { isCbor: true, type: MajorType.Simple, value: { float: NaN } };
    } else if (typeof value === 'number' && hasFractionalPart(value)) {
      return { isCbor: true, type: MajorType.Simple, value: { float: value } };
    } else if (value == Infinity) {
      return { isCbor: true, type: MajorType.Simple, value: { float: Infinity } };
    } else if (value == -Infinity) {
      return { isCbor: true, type: MajorType.Simple, value: { float: -Infinity } };
    } else if (value < 0) {
      return { isCbor: true, type: MajorType.Negative, value: value };
    } else {
      return { isCbor: true, type: MajorType.Unsigned, value: value };
    }
  } else if (typeof value === 'string') {
    // dCBOR requires all text strings to be in Unicode Normalization Form C (NFC)
    // This ensures deterministic encoding regardless of how the string was composed
    const normalized = value.normalize('NFC');
    return { isCbor: true, type: MajorType.Text, value: normalized };
  } else if (value === null) {
    return Cbor.Null;
  } else if (value === true) {
    return Cbor.True;
  } else if (value === false) {
    return Cbor.False;
  } else if (Array.isArray(value)) {
    return { isCbor: true, type: MajorType.Array, value: value.map(cbor) };
  } else if (value instanceof Uint8Array) {
    return { isCbor: true, type: MajorType.ByteString, value: value };
  } else if (value instanceof CborMap) {
    return { isCbor: true, type: MajorType.Map, value: value };
  } else if (value instanceof Map) {
    return { isCbor: true, type: MajorType.Map, value: new CborMap(value) };
  } else if ('toCbor' in value && typeof value.toCbor === 'function') {
    return value.toCbor();
  } else if (typeof value === 'object' && value !== null) {
    // Handle plain objects by converting to CborMap
    const map = new CborMap();
    for (const [key, val] of Object.entries(value)) {
      map.set(cbor(key), cbor(val));
    }
    return { isCbor: true, type: MajorType.Map, value: map };
  }

  throw new Error("Not supported");
}

export function cborHex(value: any): string {
  return bytesToHex(cborData(value));
}

export function cborData(value: any): Uint8Array {
  const c = cbor(value);
  switch (c.type) {
    case MajorType.Unsigned: {
      return encodeVarInt(MajorType.Unsigned, c.value);
    } case MajorType.Negative: {
      if (typeof c.value === 'bigint') {
        return encodeVarInt(MajorType.Negative, -c.value - 1n);
      } else if (typeof c.value === 'number') {
        return encodeVarInt(MajorType.Negative, -c.value - 1);
      }
      break;
    } case MajorType.ByteString: {
      if (c.value instanceof Uint8Array) {
        const lengthBytes = encodeVarInt(MajorType.ByteString, c.value.length);
        return new Uint8Array([...lengthBytes, ...c.value]);
      }
      break;
    } case MajorType.Text: {
      if (typeof c.value === 'string') {
        const utf8Bytes = new TextEncoder().encode(c.value);
        const lengthBytes = encodeVarInt(MajorType.Text, utf8Bytes.length);
        return new Uint8Array([...lengthBytes, ...utf8Bytes]);
      }
      break;
    } case MajorType.Tagged: {
      const tagged = c as CborTaggedType;
      if (typeof tagged.tag === 'bigint' || typeof tagged.tag === 'number') {
        const tagBytes = encodeVarInt(MajorType.Tagged, tagged.tag);
        const valueBytes = cborData(tagged.value);
        return new Uint8Array([...tagBytes, ...valueBytes]);
      }
      break;
    } case MajorType.Simple: {
      if (isSimpleValue(c.value)) {
        // Simple enum values (False, True, Null) are already the correct values
        return encodeVarInt(MajorType.Simple, c.value);
      } else if (isSimpleFloat(c.value)) {
        // Float values are encoded using floating point encoding
        return encodeBitPattern(MajorType.Simple, numberToBinary(c.value.float));
      } else if (typeof c.value === 'number') {
        // Other simple values stored as raw numbers
        return encodeVarInt(MajorType.Simple, c.value);
      }
      break;
    } case MajorType.Array: {
      const array = c as CborArrayType;
      const arrayBytes = array.value.map(cborData);
      const flatArrayBytes = concatBytes(arrayBytes)
      const lengthBytes = encodeVarInt(MajorType.Array, array.value.length);
      return new Uint8Array([...lengthBytes, ...flatArrayBytes]);
    } case MajorType.Map: {
      let map = c as CborMapType;
      let entries = map.value.entries;
      const arrayBytes = entries.map(({key, value}) => concatBytes([cborData(key), cborData(value)]));
      const flatArrayBytes = concatBytes(arrayBytes)
      const lengthBytes = encodeVarInt(MajorType.Map, entries.length);
      return new Uint8Array([...lengthBytes, ...flatArrayBytes]);
    }
  }
  throw new Error("Invalid CBOR");
}

export function encodeCbor(value: any): Uint8Array {
  return cborData(cbor(value));
}

export function taggedCbor(tag: CborNumber, value: any): Cbor {
  return {
    isCbor: true,
    type: MajorType.Tagged,
    tag: tag,
    value: cbor(value),
  };
}

export function simpleCborValue(value: number): Cbor {
  return {
    isCbor: true,
    type: MajorType.Simple,
    value: value,
  };
}
