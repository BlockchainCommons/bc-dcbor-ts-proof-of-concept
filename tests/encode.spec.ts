// Translation of bc-dcbor-rust/tests/encode.rs
// Tests core CBOR encoding/decoding functionality

import { describe, test, expect } from '@jest/globals';
import { cbor, cborData } from '../src/encode';
import { Cbor } from '../src/cbor';
import { cborDebug, cborDiagnostic } from '../src/debug';
import { bytesToHex, hexToBytes } from '../src/data-utils';
import { decodeCbor } from '../src/decode';
import { CborMap } from '../src/map';

// Helper function matching Rust's test_cbor
function testCbor(
  value: any,
  expectedDebug: string,
  expectedDisplay: string,
  expectedData: string
) {
  const cborValue = cbor(value);

  // Test debug format
  const debug = cborDebug(cborValue);
  expect(debug).toBe(expectedDebug);

  // Test display format
  const display = cborDiagnostic(cborValue);
  expect(display).toBe(expectedDisplay);

  // Test encoding
  const data = cborData(cborValue);
  const hex = bytesToHex(data);
  expect(hex).toBe(expectedData);

  // Test round-trip
  const decoded = decodeCbor(data);
  expect(decoded).toEqual(cborValue);
}

describe('Encode Tests', () => {
  describe('encode_unsigned', () => {
    test('zero', () => {
      testCbor(0, 'unsigned(0)', '0', '00');
    });

    test('one', () => {
      testCbor(1, 'unsigned(1)', '1', '01');
    });

    test('23', () => {
      testCbor(23, 'unsigned(23)', '23', '17');
    });

    test('24', () => {
      testCbor(24, 'unsigned(24)', '24', '1818');
    });

    test('255 (u8 max)', () => {
      testCbor(255, 'unsigned(255)', '255', '18ff');
    });

    test('65535 (u16 max)', () => {
      testCbor(65535, 'unsigned(65535)', '65535', '19ffff');
    });

    test('65536', () => {
      testCbor(65536, 'unsigned(65536)', '65536', '1a00010000');
    });

    test('4294967295 (u32 max)', () => {
      testCbor(4294967295, 'unsigned(4294967295)', '4294967295', '1affffffff');
    });

    test('4294967296', () => {
      testCbor(4294967296, 'unsigned(4294967296)', '4294967296', '1b0000000100000000');
    });
  });

  describe('encode_signed', () => {
    test('negative one', () => {
      testCbor(-1, 'negative(-1)', '-1', '20');
    });

    test('negative two', () => {
      testCbor(-2, 'negative(-2)', '-2', '21');
    });

    test('negative 127', () => {
      testCbor(-127, 'negative(-127)', '-127', '387e');
    });

    test('negative 128', () => {
      testCbor(-128, 'negative(-128)', '-128', '387f');
    });

    test('127', () => {
      testCbor(127, 'unsigned(127)', '127', '187f');
    });

    test('negative 32768 (i16 min)', () => {
      testCbor(-32768, 'negative(-32768)', '-32768', '397fff');
    });

    test('32767 (i16 max)', () => {
      testCbor(32767, 'unsigned(32767)', '32767', '197fff');
    });

    test('negative 2147483648 (i32 min)', () => {
      testCbor(-2147483648, 'negative(-2147483648)', '-2147483648', '3a7fffffff');
    });

    test('2147483647 (i32 max)', () => {
      testCbor(2147483647, 'unsigned(2147483647)', '2147483647', '1a7fffffff');
    });
  });

  describe('encode_bytes', () => {
    test('simple bytes', () => {
      const bytes = new Uint8Array([0x00, 0x11, 0x22, 0x33]);
      testCbor(bytes, 'bytes(00112233)', "h'00112233'", '4400112233');
    });

    test('longer bytes', () => {
      const bytes = hexToBytes('c0a7da14e5847c526244f7e083d26fe33f86d2313ad2b77164233444423a50a7');
      testCbor(
        bytes,
        'bytes(c0a7da14e5847c526244f7e083d26fe33f86d2313ad2b77164233444423a50a7)',
        "h'c0a7da14e5847c526244f7e083d26fe33f86d2313ad2b77164233444423a50a7'",
        '5820c0a7da14e5847c526244f7e083d26fe33f86d2313ad2b77164233444423a50a7'
      );
    });

    test('three bytes', () => {
      const bytes = new Uint8Array([0x11, 0x22, 0x33]);
      testCbor(bytes, 'bytes(112233)', "h'112233'", '43112233');
    });
  });

  describe('encode_string', () => {
    test('hello', () => {
      testCbor('Hello', 'text("Hello")', '"Hello"', '6548656c6c6f');
    });

    test('long text', () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
      testCbor(
        longText,
        'text("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")',
        '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."',
        '7901bd4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742c2073656420646f20656975736d6f642074656d706f7220696e6369646964756e74207574206c61626f726520657420646f6c6f7265206d61676e6120616c697175612e20557420656e696d206164206d696e696d2076656e69616d2c2071756973206e6f737472756420657865726369746174696f6e20756c6c616d636f206c61626f726973206e69736920757420616c697175697020657820656120636f6d6d6f646f20636f6e7365717561742e2044756973206175746520697275726520646f6c6f7220696e20726570726568656e646572697420696e20766f6c7570746174652076656c697420657373652063696c6c756d20646f6c6f726520657520667567696174206e756c6c612070617269617475722e204578636570746575722073696e74206f6363616563617420637570696461746174206e6f6e2070726f6964656e742c2073756e7420696e2063756c706120717569206f666669636961206465736572756e74206d6f6c6c697420616e696d20696420657374206c61626f72756d2e'
      );
    });
  });

  describe('test_normalized_string', () => {
    test('NFC normalization', () => {
      const composedEAcute = '\u{00E9}'; // é in NFC
      const decomposedEAcute = 'e\u{0301}'; // e followed by combining acute accent (NFD)

      // In JavaScript, these are different strings
      expect(composedEAcute).not.toBe(decomposedEAcute);

      // They serialize differently in raw UTF-8
      const utf8_1 = new TextEncoder().encode(composedEAcute);
      const utf8_2 = new TextEncoder().encode(decomposedEAcute);
      expect(bytesToHex(utf8_1)).not.toBe(bytesToHex(utf8_2));

      // But serializing them as dCBOR yields the same data
      const cbor1 = cborData(cbor(composedEAcute));
      const cbor2 = cborData(cbor(decomposedEAcute));
      expect(bytesToHex(cbor1)).toBe(bytesToHex(cbor2));

      // Non-NFC strings should be rejected on decode
      const cborBytes = hexToBytes('6365cc81'); // NFD encoded string
      expect(() => decodeCbor(cborBytes)).toThrow(/Unicode Canonical Normalization Form C|NFC/i);
    });
  });

  describe('encode_array', () => {
    test('empty array', () => {
      testCbor([], 'array([])', '[]', '80');
    });

    test('simple array', () => {
      testCbor([1, 2, 3], 'array([unsigned(1), unsigned(2), unsigned(3)])', '[1, 2, 3]', '83010203');
    });

    test('mixed signs', () => {
      testCbor([1, -2, 3], 'array([unsigned(1), negative(-2), unsigned(3)])', '[1, -2, 3]', '83012103');
    });
  });

  describe('encode_heterogenous_array', () => {
    test('mixed types', () => {
      const array = [1, 'Hello', [1, 2, 3]];
      testCbor(
        array,
        'array([unsigned(1), text("Hello"), array([unsigned(1), unsigned(2), unsigned(3)])])',
        '[1, "Hello", [1, 2, 3]]',
        '83016548656c6c6f83010203'
      );
    });
  });

  describe('encode_map', () => {
    test('empty map', () => {
      const m = new CborMap();
      testCbor(m, 'map({})', '{}', 'a0');
    });

    test('complex map with key ordering', () => {
      const m = new CborMap();
      m.set(-1, 3);
      m.set([-1], 7);
      m.set('z', 4);
      m.set(10, 1);
      m.set(false, 8);
      m.set(100, 2);
      m.set('aa', 5);
      m.set([100], 6);

      testCbor(
        m,
        'map({0x0a: (unsigned(10), unsigned(1)), 0x1864: (unsigned(100), unsigned(2)), 0x20: (negative(-1), unsigned(3)), 0x617a: (text("z"), unsigned(4)), 0x626161: (text("aa"), unsigned(5)), 0x811864: (array([unsigned(100)]), unsigned(6)), 0x8120: (array([negative(-1)]), unsigned(7)), 0xf4: (simple(false), unsigned(8))})',
        '{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}',
        'a80a011864022003617a046261610581186406812007f408'
      );

      // Test get operations
      expect(m.get(false)).toBe(8);
      expect(m.get(true)).toBeUndefined();
      expect(m.get(-1)).toBe(3);
      expect(m.get('z')).toBe(4);
    });

    test('map with map keys', () => {
      const k1 = new CborMap();
      k1.set(1, 2);

      const k2 = new CborMap();
      k2.set(3, 4);

      const m = new CborMap();
      m.set(k1, 5);
      m.set(k2, 6);

      testCbor(
        m,
        'map({0xa10102: (map({0x01: (unsigned(1), unsigned(2))}), unsigned(5)), 0xa10304: (map({0x03: (unsigned(3), unsigned(4))}), unsigned(6))})',
        '{{1: 2}: 5, {3: 4}: 6}',
        'a2a1010205a1030406'
      );
    });
  });

  describe('encode_map_misordered', () => {
    test('reject misordered keys', () => {
      const cborHex = 'a2026141016142'; // Map with keys in wrong order
      expect(() => decodeCbor(hexToBytes(cborHex))).toThrow(/canonical order|misordered|ascending order/i);
    });
  });
});
