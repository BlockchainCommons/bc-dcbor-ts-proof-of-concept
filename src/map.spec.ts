import { hexToBytes } from "./data-utils";
import { cborDebug, cborDiagnostic } from "./debug";
import { decodeCbor } from "./decode";
import { cbor, cborData, cborHex } from "./encode";
import { extractCbor } from "./extract";
import { CborMap } from "./map";
import { Cbor } from "./cbor";

describe('CborMap', () => {
  test('set and get, encode and decode', () => {
    const map = new CborMap();
    map.set(-1, 3);
    map.set([-1], 7)
    map.set("z", 4)
    map.set(10, 1)
    map.set(false, 8)
    map.set(100, 2)
    map.set("aa", 5)
    map.set([100], 6)

    expect(map.get(-1)).toBe(3);

    const mapCbor = cbor(map);
    expect(cborDebug(mapCbor)).toBe('map({0x0a: (unsigned(10), unsigned(1)), 0x1864: (unsigned(100), unsigned(2)), 0x20: (negative(-1), unsigned(3)), 0x617a: (text("z"), unsigned(4)), 0x626161: (text("aa"), unsigned(5)), 0x811864: (array([unsigned(100)]), unsigned(6)), 0x8120: (array([negative(-1)]), unsigned(7)), 0xf4: (simple(false), unsigned(8))})');
    expect(cborDiagnostic(mapCbor)).toBe('{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}');

    const encoded = cborData(mapCbor);
    const decodedCbor = decodeCbor(encoded);

    expect(cborDebug(mapCbor)).toEqual(cborDebug(decodedCbor));
    expect(cborDiagnostic(mapCbor)).toEqual(cborDiagnostic(decodedCbor));
    expect(cborData(mapCbor)).toEqual(cborData(decodedCbor));
  });

  test('convert from and to JavaScript Map', () => {
    const map = new Map<any, number>([
      [-1, 3],
      [[-1], 7],
      ["z", 4],
      [10, 1],
      [false, 8],
      [100, 2],
      ["aa", 5],
      [[100], 6],
    ]);

    const mapCbor = cbor(map);
    expect(cborDiagnostic(mapCbor)).toBe('{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}');
    const encoded = cborData(mapCbor);
    const decoded = decodeCbor(encoded);
    expect(cborDiagnostic(mapCbor)).toEqual(cborDiagnostic(decoded));
    expect((extractCbor(decoded) as Cbor).value as CborMap).toBeDefined();
    expect(((extractCbor(decoded) as Cbor).value as CborMap).toMap()).toEqual(map);
  });

  test('Anders map', () => {
    const map = new Map<any, any>([
      [1, 45.7],
      [2, 'Hi there!']
    ]);
    expect(cborHex(map)).toBe('a201fb4046d9999999999a0269486920746865726521');
    expect(map.get(1)).toBe(45.7);
  });

  test('rejects misordered map', () => {
    expect(() => extractCbor(hexToBytes("a8f4080a011864022003617a046261610581186406812007"))).toThrowError('map keys must be in ascending order');
  });

  test('rejects duplicate key', () => {
    expect(() => extractCbor(hexToBytes("a90a011864022003617a046261610581186406812007f408f408"))).toThrowError('duplicate map key');
  });
});
