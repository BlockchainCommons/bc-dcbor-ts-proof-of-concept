/**
 * dCBOR Compliance Test Suite
 *
 * Tests for critical dCBOR specification requirements including:
 * - Unicode Normalization Form C (NFC)
 * - Negative integer encoding
 * - Map ordering edge cases
 * - NaN canonicalization
 */

import { cbor, cborData } from './encode';
import { decodeCbor } from './decode';
import { extractCbor } from './extract';
import { CborMap } from './map';
import { MajorType } from './cbor';

// Alias for cleaner test code
const decode = (data: Uint8Array) => extractCbor(decodeCbor(data));

describe('dCBOR Compliance Tests', () => {
  describe('Unicode Normalization Form C (NFC)', () => {
    test('normalizes NFD to NFC on encode', () => {
      // "café" in NFD form (e + combining acute accent)
      const nfd = 'cafe\u0301';  // NFD: e + combining acute
      // "café" in NFC form (single é character)
      const nfc = 'caf\u00e9';   // NFC: single é

      // Both should produce identical CBOR encoding
      const encodedNFD = cborData(nfd);
      const encodedNFC = cborData(nfc);

      expect(encodedNFD).toEqual(encodedNFC);
    });

    test('normalizes various combining characters', () => {
      // Various strings with combining characters
      const testCases = [
        // String with multiple combining characters
        ['e\u0301\u0300', '\u00e9\u0300'],  // e + acute + grave
        // Different representations of ñ
        ['n\u0303', '\u00f1'],              // n + tilde vs single ñ
        // Hebrew with nikud
        ['\u05e9\u05c1', '\ufb2a'],         // shin + dot vs single character
      ];

      for (const [form1, form2] of testCases) {
        const encoded1 = cborData(form1);
        const encoded2 = cborData(form2);
        // If both normalize to same NFC, encodings should match
        if (form1.normalize('NFC') === form2.normalize('NFC')) {
          expect(encoded1).toEqual(encoded2);
        }
      }
    });

    test('rejects non-NFC strings on decode', () => {
      // Manually create CBOR with non-NFC string (bypassing our encoder)
      const nfdString = 'cafe\u0301';  // NFD form
      const nfdBytes = new TextEncoder().encode(nfdString);

      // Build CBOR manually: major type 3 (text), length, then bytes
      const cborBytes = new Uint8Array([
        0x60 + nfdBytes.length,  // major type 3, length
        ...nfdBytes
      ]);

      // Should reject on decode
      expect(() => decode(cborBytes)).toThrow('not in Unicode Normalization Form C');
    });

    test('round-trip preserves NFC normalization', () => {
      const testStrings = [
        'café',           // Common accented character
        'naïve',          // i with diaeresis
        'Zürich',         // u with umlaut
        'Москва',         // Cyrillic
        '北京',           // Chinese
        'العربية',       // Arabic
        'עברית',         // Hebrew
        '日本語',         // Japanese
        '한국어',         // Korean
        'Ελληνικά',      // Greek
      ];

      for (const str of testStrings) {
        const encoded = cborData(str);
        const decoded = decode(encoded);

        // Decoded string should be in NFC form
        expect(decoded).toBe(str.normalize('NFC'));
      }
    });

    test('handles empty string correctly', () => {
      const encoded = cborData('');
      const decoded = decode(encoded);
      expect(decoded).toBe('');
    });

    test('handles ASCII-only strings (no normalization needed)', () => {
      const ascii = 'Hello, World! 123';
      const encoded = cborData(ascii);
      const decoded = decode(encoded);
      expect(decoded).toBe(ascii);
    });
  });

  describe('Negative Integer Encoding', () => {
    test('encodes -1 correctly', () => {
      const encoded = cborData(-1);
      expect(encoded).toEqual(new Uint8Array([0x20]));  // major type 1, value 0
    });

    test('encodes -256 correctly', () => {
      const encoded = cborData(-256);
      expect(encoded).toEqual(new Uint8Array([0x38, 0xFF]));  // major type 1, value 255
    });

    test('encodes -65536 correctly', () => {
      const encoded = cborData(-65536);
      expect(encoded).toEqual(new Uint8Array([0x39, 0xFF, 0xFF]));  // major type 1, value 65535
    });

    test('round-trips negative integers correctly', () => {
      const testValues = [-1, -2, -10, -100, -256, -257, -1000, -10000, -65536, -1000000];

      for (const value of testValues) {
        const encoded = cborData(value);
        const decoded = decode(encoded);
        expect(decoded).toBe(value);
      }
    });

    test('handles negative bigints correctly', () => {
      const testValues = [-1n, -256n, -65536n, -4294967296n];

      for (const value of testValues) {
        const encoded = cborData(value);
        const decoded = decode(encoded);
        expect(decoded).toBe(value);
      }
    });

    test('boundary values', () => {
      const boundaries = [
        -1,        // Smallest negative
        -24,       // Last single-byte encoding
        -25,       // First two-byte encoding
        -256,      // Last two-byte encoding
        -257,      // First three-byte encoding
        -65536,    // Last three-byte encoding
        -65537,    // First five-byte encoding
      ];

      for (const value of boundaries) {
        const encoded = cborData(value);
        const decoded = decode(encoded);
        expect(decoded).toBe(value);
      }
    });
  });

  describe('Map Ordering Edge Cases', () => {
    test('orders keys with null bytes correctly', () => {
      const map = new CborMap();
      map.set(new Uint8Array([0x00, 0x02]), 'a');
      map.set(new Uint8Array([0x00, 0x01]), 'b');
      map.set(new Uint8Array([0x00, 0x00]), 'c');

      const entries = map.entries;

      // Should be sorted lexicographically
      expect((entries[0].key as any).value).toEqual(new Uint8Array([0x00, 0x00]));
      expect((entries[1].key as any).value).toEqual(new Uint8Array([0x00, 0x01]));
      expect((entries[2].key as any).value).toEqual(new Uint8Array([0x00, 0x02]));
    });

    test('orders keys with 0xFF bytes correctly', () => {
      const map = new CborMap();
      map.set(new Uint8Array([0xFF, 0x00]), 'a');
      map.set(new Uint8Array([0xFF, 0xFF]), 'b');
      map.set(new Uint8Array([0xFE, 0xFF]), 'c');

      const entries = map.entries;

      // 0xFE comes before 0xFF
      expect((entries[0].key as any).value).toEqual(new Uint8Array([0xFE, 0xFF]));
      expect((entries[1].key as any).value).toEqual(new Uint8Array([0xFF, 0x00]));
      expect((entries[2].key as any).value).toEqual(new Uint8Array([0xFF, 0xFF]));
    });

    test('orders keys of different lengths correctly', () => {
      const map = new CborMap();
      map.set(new Uint8Array([0x01, 0x00]), 'longer');
      map.set(new Uint8Array([0x01]), 'shorter');
      map.set(new Uint8Array([0x02]), 'middle');

      const entries = map.entries;

      // Shorter keys come before longer keys with same prefix
      expect((entries[0].key as any).value).toEqual(new Uint8Array([0x01]));
      expect((entries[1].key as any).value).toEqual(new Uint8Array([0x01, 0x00]));
      expect((entries[2].key as any).value).toEqual(new Uint8Array([0x02]));
    });

    test('handles empty key correctly', () => {
      const map = new CborMap();
      map.set(new Uint8Array([]), 'empty');
      map.set(new Uint8Array([0x00]), 'zero');
      map.set(new Uint8Array([0x01]), 'one');

      const entries = map.entries;

      // Empty key should come first
      expect((entries[0].key as any).value).toEqual(new Uint8Array([]));
      expect((entries[1].key as any).value).toEqual(new Uint8Array([0x00]));
      expect((entries[2].key as any).value).toEqual(new Uint8Array([0x01]));
    });

    test('round-trips maps with complex keys', () => {
      const map = new CborMap();
      map.set([1, 2, 3], 'array key');
      map.set('text', 'text key');
      map.set(42, 'number key');
      map.set(new Uint8Array([0xAA, 0xBB]), 'bytes key');

      const mapCbor = cbor(map);
      const encoded = cborData(mapCbor);
      const decodedCbor = decodeCbor(encoded);

      expect(decodedCbor.type).toBe(MajorType.Map);
      expect((decodedCbor as any).value.length).toBe(4);
    });
  });

  describe('NaN Canonicalization', () => {
    test('all NaN variants produce identical encoding', () => {
      const nanVariants = [
        NaN,
        0 / 0,
        Infinity - Infinity,
        Math.sqrt(-1),
        Number.NaN,
      ];

      const encodings = nanVariants.map(v => cborData(v));

      // All should produce identical encoding
      for (let i = 1; i < encodings.length; i++) {
        expect(encodings[i]).toEqual(encodings[0]);
      }

      // Should be the canonical NaN: 0xf97e00 (half-precision float)
      expect(encodings[0]).toEqual(new Uint8Array([0xf9, 0x7e, 0x00]));
    });

    test('round-trips NaN correctly', () => {
      const encoded = cborData(NaN);
      const decoded = decode(encoded);
      expect(Number.isNaN(decoded)).toBe(true);
    });

    test('distinguishes NaN from infinity', () => {
      const nanEncoded = cborData(NaN);
      const infEncoded = cborData(Infinity);
      const negInfEncoded = cborData(-Infinity);

      expect(nanEncoded).not.toEqual(infEncoded);
      expect(nanEncoded).not.toEqual(negInfEncoded);
      expect(infEncoded).not.toEqual(negInfEncoded);
    });
  });

  describe('Float Size Reduction', () => {
    test('reduces integer-valued floats to integers', () => {
      // 3.0 should be encoded as integer 3, not float
      const encoded = cborData(3.0);
      const decodedCbor = decodeCbor(encoded);

      expect(decodedCbor.type).toBe(MajorType.Unsigned);
      expect((decodedCbor as any).value).toBe(3);
      // Should be encoded as integer (major type 0)
      expect(encoded[0] >> 5).toBe(0);  // major type 0
    });

    test('encodes true floats as floats', () => {
      const encoded = cborData(3.14);
      const decoded = decode(encoded);

      expect(decoded).toBeCloseTo(3.14, 5);
      const decodedCbor = decodeCbor(encoded);
      // Should be encoded as simple/float (major type 7)
      expect(decodedCbor.type).toBe(MajorType.Simple);
    });

    test('uses smallest float representation', () => {
      // Test that floats are reduced to smallest possible size
      const testCases = [
        { value: 1.5, maxBytes: 3 },      // Should fit in half-precision
        { value: 65504, maxBytes: 3 },    // Max half-precision
        { value: 65505, maxBytes: 5 },    // Needs single-precision
      ];

      for (const { value, maxBytes } of testCases) {
        const encoded = cborData(value);
        expect(encoded.length).toBeLessThanOrEqual(maxBytes);

        const decoded = decode(encoded);
        expect(decoded).toBeCloseTo(value, 2);
      }
    });
  });

  describe('Deterministic Encoding', () => {
    test('identical values produce identical encodings', () => {
      const testCases = [
        42,
        'hello',
        [1, 2, 3],
        { a: 1, b: 2 },
        true,
        false,
        null,
      ];

      for (const value of testCases) {
        const encoded1 = cborData(value);
        const encoded2 = cborData(value);
        expect(encoded1).toEqual(encoded2);
      }
    });

    test('map with same entries in different order produces same encoding', () => {
      const map1 = new CborMap();
      map1.set('a', 1);
      map1.set('b', 2);
      map1.set('c', 3);

      const map2 = new CborMap();
      map2.set('c', 3);
      map2.set('a', 1);
      map2.set('b', 2);

      const encoded1 = cborData(cbor(map1));
      const encoded2 = cborData(cbor(map2));

      expect(encoded1).toEqual(encoded2);
    });

    test('3.0 equals 3 after encoding', () => {
      // Float 3.0 should be reduced to integer 3
      const floatEncoded = cborData(3.0);
      const intEncoded = cborData(3);

      expect(floatEncoded).toEqual(intEncoded);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('handles very long strings', () => {
      const longString = 'a'.repeat(10000);
      const encoded = cborData(longString);
      const decoded = decode(encoded);
      expect(decoded).toBe(longString);
    });

    test('handles deeply nested structures', () => {
      let nested: any = 'bottom';
      for (let i = 0; i < 100; i++) {
        nested = [nested];
      }

      const encoded = cborData(nested);
      const decoded = decode(encoded);

      // Verify structure depth
      let current = decoded;
      let depth = 0;
      while (Array.isArray(current)) {
        current = current[0];
        depth++;
      }
      expect(depth).toBe(100);
      expect(current).toBe('bottom');
    });

    test('handles large byte arrays', () => {
      const largeBytes = new Uint8Array(10000);
      for (let i = 0; i < largeBytes.length; i++) {
        largeBytes[i] = i % 256;
      }

      const encoded = cborData(largeBytes);
      const decoded = decode(encoded);

      expect(decoded).toEqual(largeBytes);
    });

    test('handles maps with many entries', () => {
      const map = new CborMap();
      for (let i = 0; i < 1000; i++) {
        map.set(`key${i}`, i);
      }

      const mapCbor = cbor(map);
      const encoded = cborData(mapCbor);
      const decodedCbor = decodeCbor(encoded);

      expect((decodedCbor as any).value.length).toBe(1000);
    });
  });
});
