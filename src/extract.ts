import { Cbor, CborNumber, MajorType } from "./cbor";
import { cborDiagnostic } from "./debug";
import { decodeCbor } from "./decode";
import { SimpleValue, isSimpleValue, isSimpleFloat } from "./simple";

export function extractCbor(cbor: Cbor | Uint8Array): any | undefined {
  let c: Cbor;
  if (cbor instanceof Uint8Array) {
    c = decodeCbor(cbor);
  } else {
    c = cbor;
  }
  switch (c.type) {
    case MajorType.Unsigned:
      return c.value;
    case MajorType.Negative:
      return c.value;
    case MajorType.ByteString:
      return c.value;
    case MajorType.Text:
      return c.value;
    case MajorType.Array:
      return c.value.map(extractCbor);
    case MajorType.Map:
      return c.value;
    case MajorType.Tagged:
      return c;
    case MajorType.Simple:
      if (c.value === SimpleValue.True) {
        return true;
      } else if (c.value === SimpleValue.False) {
        return false;
      } else if (c.value === SimpleValue.Null) {
        return null;
      } else if (isSimpleFloat(c.value)) {
        return c.value.float;
      }
      return c;
  }
  return undefined;
}

export function getCborTagged(cbor: Cbor, tag: number): any | undefined {
  if (cbor.type == MajorType.Tagged && cbor.tag == tag) {
    return extractCbor(cbor.value);
  }
  return undefined;
}

export function expectCborTagged(cbor: Cbor, tag: number): any {
  const value = getCborTagged(cbor, tag);
  if (value === undefined) {
    throw new Error(`Expected tagged value ${tag}, got ${cborDiagnostic(cbor)}`);
  }
  return value;
}

export function getCborBoolean(cbor: Cbor): boolean | undefined {
  if (cbor.type == MajorType.Simple) {
    if (cbor.value == Cbor.true.value) {
      return true;
    } else if (cbor.value == Cbor.false.value) {
      return false;
    }
  }
  return undefined;
}

export function expectCborBoolean(cbor: Cbor): boolean {
  const value = getCborBoolean(cbor);
  if (value === undefined) {
    throw new Error(`Expected boolean, got ${cborDiagnostic(cbor)}`);
  }
  return value;
}

export function getCborInteger(cbor: Cbor): number | undefined {
  if (cbor.type == MajorType.Unsigned && typeof cbor.value == 'number') {
    return cbor.value;
  } else if (cbor.type == MajorType.Negative && typeof cbor.value == 'number') {
    return cbor.value;
  }
  return undefined;
}

export function expectCborInteger(cbor: Cbor): number {
  const value = getCborInteger(cbor);
  if (value === undefined) {
    throw new Error(`Expected integer, got ${cborDiagnostic(cbor)}`);
  }
  return value;
}

export function getCborNumber(cbor: Cbor): CborNumber | undefined {
  switch (cbor.type) {
    case MajorType.Unsigned:
      return cbor.value;
    case MajorType.Negative:
      return cbor.value;
    case MajorType.Simple:
      if (isSimpleFloat(cbor.value)) {
        return cbor.value.float;
      }
  }
}

export function expectCborNumber(cbor: Cbor): CborNumber {
  const value = getCborNumber(cbor);
  if (value === undefined) {
    throw new Error(`Expected number, got ${cborDiagnostic(cbor)}`);
  }
  return value;
}
