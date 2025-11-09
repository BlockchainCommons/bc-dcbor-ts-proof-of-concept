import { Cbor, MajorType } from './cbor';
import { cborHash } from './hash';
import { cbor } from './encode';
import { SimpleValue } from './simple';

describe('CBOR Hash Implementation', () => {
  describe('Basic types', () => {
    it('should hash simple values consistently', () => {
      const hash1 = cborHash(Cbor.True);
      const hash2 = cborHash(Cbor.True);
      expect(hash1).toBe(hash2);

      const hashFalse = cborHash(Cbor.False);
      expect(hashFalse).not.toBe(hash1);

      const hashNull = cborHash(Cbor.Null);
      expect(hashNull).not.toBe(hash1);
      expect(hashNull).not.toBe(hashFalse);
    });

    it('should hash unsigned integers', () => {
      const cbor1 = cbor(42);
      const cbor2 = cbor(42);
      const cbor3 = cbor(43);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash negative integers', () => {
      const cbor1 = cbor(-42);
      const cbor2 = cbor(-42);
      const cbor3 = cbor(-43);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should distinguish positive from negative with same magnitude', () => {
      const positive = cbor(42);
      const negative = cbor(-42);

      expect(cborHash(positive)).not.toBe(cborHash(negative));
    });

    it('should hash bigints', () => {
      const cbor1 = cbor(BigInt('9007199254740992')); // > MAX_SAFE_INTEGER
      const cbor2 = cbor(BigInt('9007199254740992'));
      const cbor3 = cbor(BigInt('9007199254740993'));

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash strings', () => {
      const cbor1 = cbor('hello');
      const cbor2 = cbor('hello');
      const cbor3 = cbor('world');

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash byte strings', () => {
      const bytes1 = new Uint8Array([1, 2, 3]);
      const bytes2 = new Uint8Array([1, 2, 3]);
      const bytes3 = new Uint8Array([1, 2, 4]);

      const cbor1 = cbor(bytes1);
      const cbor2 = cbor(bytes2);
      const cbor3 = cbor(bytes3);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash floats', () => {
      const cbor1 = cbor(3.14);
      const cbor2 = cbor(3.14);
      const cbor3 = cbor(2.71);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });
  });

  describe('Complex types', () => {
    it('should hash arrays', () => {
      const cbor1 = cbor([1, 2, 3]);
      const cbor2 = cbor([1, 2, 3]);
      const cbor3 = cbor([1, 2, 4]);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should distinguish arrays by order', () => {
      const cbor1 = cbor([1, 2, 3]);
      const cbor2 = cbor([3, 2, 1]);

      expect(cborHash(cbor1)).not.toBe(cborHash(cbor2));
    });

    it('should hash nested arrays', () => {
      const cbor1 = cbor([[1, 2], [3, 4]]);
      const cbor2 = cbor([[1, 2], [3, 4]]);
      const cbor3 = cbor([[1, 2], [3, 5]]);

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash maps', () => {
      const cbor1 = cbor({ a: 1, b: 2 });
      const cbor2 = cbor({ a: 1, b: 2 });
      const cbor3 = cbor({ a: 1, b: 3 });

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3));
    });

    it('should hash tagged values', () => {
      const { taggedCbor } = require('./encode');

      const cbor1 = taggedCbor(1, 'test');
      const cbor2 = taggedCbor(1, 'test');
      const cbor3 = taggedCbor(2, 'test');
      const cbor4 = taggedCbor(1, 'different');

      expect(cborHash(cbor1)).toBe(cborHash(cbor2));
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor3)); // different tag
      expect(cborHash(cbor1)).not.toBe(cborHash(cbor4)); // different value
    });
  });

  describe('Type discrimination', () => {
    it('should distinguish different types with same value representation', () => {
      const unsigned = cbor(5);
      const text = cbor('5');

      expect(cborHash(unsigned)).not.toBe(cborHash(text));
    });

    it('should distinguish empty containers by type', () => {
      const emptyArray = cbor([]);
      const emptyMap = cbor({});

      expect(cborHash(emptyArray)).not.toBe(cborHash(emptyMap));
    });
  });

  describe('Hash consistency', () => {
    it('should produce consistent hashes across multiple calls', () => {
      const testCbor = cbor({
        num: 42,
        str: 'hello',
        arr: [1, 2, 3],
        nested: { a: 1, b: 2 }
      });

      const hash1 = cborHash(testCbor);
      const hash2 = cborHash(testCbor);
      const hash3 = cborHash(testCbor);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should return 32-bit unsigned integer', () => {
      const testCbor = cbor('test');
      const hash = cborHash(testCbor);

      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    });
  });

  describe('Cbor.hash() convenience method', () => {
    it('should work via Cbor.hash()', () => {
      const testCbor = cbor(42);
      const directHash = cborHash(testCbor);
      const convenienceHash = Cbor.hash(testCbor);

      expect(convenienceHash).toBe(directHash);
    });
  });
});
