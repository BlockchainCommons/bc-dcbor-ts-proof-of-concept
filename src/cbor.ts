import { CborMap } from "./map";

export enum MajorType {
  Unsigned = 0,
  Negative = 1,
  ByteString = 2,
  Text = 3,
  Array = 4,
  Map = 5,
  Tagged = 6,
  Simple = 7,
}

export type CborNumber = number | bigint;
export type CborFloat = { float: number };

export function isCborNumber(value: any): value is CborNumber {
  return typeof value === 'number' || typeof value === 'bigint';
}

export function isCbor(value: any): boolean {
  return value && typeof value === 'object' && 'isCbor' in value && value.isCbor === true;
}

export function isCborFloat(value: any): value is CborFloat {
  return value && typeof value === 'object' && 'float' in value && typeof value.float === 'number';
}

export type CborUnsignedType = { isCbor: true, type: MajorType.Unsigned, value: CborNumber };
export type CborNegativeType = { isCbor: true, type: MajorType.Negative, value: CborNumber };
export type CborByteStringType = { isCbor: true, type: MajorType.ByteString, value: Uint8Array };
export type CborTextType = { isCbor: true, type: MajorType.Text, value: string };
export type CborArrayType = { isCbor: true, type: MajorType.Array, value: Cbor[] };
export type CborMapType = { isCbor: true, type: MajorType.Map, value: CborMap };
export type CborTaggedType = { isCbor: true, type: MajorType.Tagged, tag: CborNumber, value: Cbor };
export type CborSimpleType = { isCbor: true, type: MajorType.Simple, value: CborNumber | CborFloat };

export type Cbor = CborUnsignedType |
  CborNegativeType | CborByteStringType | CborTextType |
  CborArrayType | CborMapType | CborTaggedType |
  CborSimpleType;

export const Cbor = {
  // The CBOR symbolic value for `false`.
  false: { isCbor: true, type: MajorType.Simple, value: 0x14 } as CborSimpleType,
  // The CBOR symbolic value for `true`.
  true: { isCbor: true, type: MajorType.Simple, value: 0x15 } as CborSimpleType,
  // The CBOR symbolic value for `null`.
  null: { isCbor: true, type: MajorType.Simple, value: 0x16 } as CborSimpleType,
};
