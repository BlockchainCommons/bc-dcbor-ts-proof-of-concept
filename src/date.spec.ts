/**
 * Tests for CBOR Date/Time support.
 */

import { CborDate } from './date';
import { MajorType } from './cbor';
import { extractCbor } from './extract';
import { getTagValue } from './cbor-tagged';
import { TAG_EPOCH_DATE_TIME } from './tags';

describe('CborDate Tests', () => {
  describe('Factory Methods', () => {
    test('creates date from timestamp', () => {
      const date = CborDate.fromTimestamp(1647885871);
      expect(date.timestamp()).toBe(1647885871);
    });

    test('creates date from timestamp with fractional seconds', () => {
      const date = CborDate.fromTimestamp(1647885871.5);
      expect(date.timestamp()).toBe(1647885871.5);
    });

    test('creates date from negative timestamp', () => {
      const date = CborDate.fromTimestamp(-100);
      expect(date.timestamp()).toBe(-100);
    });

    test('creates date from YMD', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const jsDate = date.getDate();

      expect(jsDate.getUTCFullYear()).toBe(2022);
      expect(jsDate.getUTCMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(jsDate.getUTCDate()).toBe(21);
      expect(jsDate.getUTCHours()).toBe(0);
      expect(jsDate.getUTCMinutes()).toBe(0);
      expect(jsDate.getUTCSeconds()).toBe(0);
    });

    test('creates date from YMDHMS', () => {
      const date = CborDate.fromYMDHMS(2022, 3, 21, 18, 24, 31);
      const jsDate = date.getDate();

      expect(jsDate.getUTCFullYear()).toBe(2022);
      expect(jsDate.getUTCMonth()).toBe(2);
      expect(jsDate.getUTCDate()).toBe(21);
      expect(jsDate.getUTCHours()).toBe(18);
      expect(jsDate.getUTCMinutes()).toBe(24);
      expect(jsDate.getUTCSeconds()).toBe(31);
    });

    test('creates date from ISO string', () => {
      const date = CborDate.fromString('2022-03-21T18:24:31Z');
      const jsDate = date.getDate();

      expect(jsDate.getUTCFullYear()).toBe(2022);
      expect(jsDate.getUTCMonth()).toBe(2);
      expect(jsDate.getUTCDate()).toBe(21);
      expect(jsDate.getUTCHours()).toBe(18);
    });

    test('creates date from ISO date-only string', () => {
      const date = CborDate.fromString('2022-03-21');
      const jsDate = date.getDate();

      expect(jsDate.getUTCFullYear()).toBe(2022);
      expect(jsDate.getUTCMonth()).toBe(2);
      expect(jsDate.getUTCDate()).toBe(21);
    });

    test('throws on invalid date string', () => {
      expect(() => CborDate.fromString('not-a-date')).toThrow('Invalid date string');
    });

    test('creates date for now', () => {
      const before = Date.now();
      const date = CborDate.now();
      const after = Date.now();

      const timestamp = date.timestamp() * 1000;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('creates date with duration from now', () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const tomorrow = CborDate.withDurationFromNow(oneDay);

      const diff = tomorrow.timestamp() * 1000 - now;
      expect(diff).toBeGreaterThan(oneDay * 0.99); // Allow small timing variance
      expect(diff).toBeLessThan(oneDay * 1.01);
    });
  });

  describe('CBOR Encoding', () => {
    test('encodes whole seconds as integer', () => {
      const date = CborDate.fromTimestamp(1234567890);
      const untagged = date.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Unsigned);
      if (untagged.type === MajorType.Unsigned) {
        expect(untagged.value).toBe(1234567890);
      }
    });

    test('encodes fractional seconds as float', () => {
      const date = CborDate.fromTimestamp(1234567890.5);
      const untagged = date.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Simple);
      if (untagged.type === MajorType.Simple &&
          typeof untagged.value === 'object' &&
          'float' in untagged.value) {
        expect(untagged.value.float).toBe(1234567890.5);
      }
    });

    test('encodes negative timestamp', () => {
      const date = CborDate.fromTimestamp(-100);
      const untagged = date.untaggedCbor();

      expect(untagged.type).toBe(MajorType.Negative);
      if (untagged.type === MajorType.Negative) {
        expect(untagged.value).toBe(-100);
      }
    });

    test('tagged encoding includes tag(1)', () => {
      const date = CborDate.fromTimestamp(1234567890);
      const tagged = date.taggedCbor();

      expect(tagged.type).toBe(MajorType.Tagged);
      expect(getTagValue(tagged)).toBe(TAG_EPOCH_DATE_TIME);
    });

    test('tagged encoding preserves value', () => {
      const date = CborDate.fromTimestamp(1234567890);
      const tagged = date.taggedCbor();

      if (tagged.type === MajorType.Tagged) {
        const content = tagged.value;
        expect(content.type).toBe(MajorType.Unsigned);
        if (content.type === MajorType.Unsigned) {
          expect(content.value).toBe(1234567890);
        }
      }
    });
  });

  describe('CBOR Decoding', () => {
    test('decodes from unsigned integer', () => {
      const original = CborDate.fromTimestamp(1234567890);
      const untagged = original.untaggedCbor();
      const decoded = new CborDate().fromUntaggedCbor(untagged);

      expect(decoded.timestamp()).toBe(1234567890);
    });

    test('decodes from float', () => {
      const original = CborDate.fromTimestamp(1234567890.5);
      const untagged = original.untaggedCbor();
      const decoded = new CborDate().fromUntaggedCbor(untagged);

      expect(decoded.timestamp()).toBe(1234567890.5);
    });

    test('decodes from negative integer', () => {
      const original = CborDate.fromTimestamp(-100);
      const untagged = original.untaggedCbor();
      const decoded = new CborDate().fromUntaggedCbor(untagged);

      expect(decoded.timestamp()).toBe(-100);
    });

    test('decodes from tagged CBOR', () => {
      const original = CborDate.fromTimestamp(1234567890);
      const tagged = original.taggedCbor();
      const decoded = CborDate.fromTaggedCborStatic(tagged);

      expect(decoded.timestamp()).toBe(1234567890);
    });

    test('throws on invalid CBOR type', () => {
      const invalidCbor = { isCbor: true as const, type: MajorType.Text, value: 'not-a-timestamp' };

      expect(() => {
        new CborDate().fromUntaggedCbor(invalidCbor as any);
      }).toThrow('Invalid date CBOR: expected numeric value');
    });

    test('throws on invalid tagged CBOR', () => {
      const wrongTag = {
        isCbor: true as const,
        type: MajorType.Tagged,
        tag: 999,
        value: { isCbor: true as const, type: MajorType.Unsigned, value: 12345 }
      };

      expect(() => {
        new CborDate().fromTaggedCbor(wrongTag as any);
      }).toThrow('Expected tag 1, got 999');
    });
  });

  describe('Round-Trip Encoding/Decoding', () => {
    test('round-trip with whole seconds', () => {
      const original = CborDate.fromYMD(2022, 3, 21);
      const tagged = original.taggedCbor();
      const decoded = CborDate.fromTaggedCborStatic(tagged);

      expect(decoded.timestamp()).toBe(original.timestamp());
    });

    test('round-trip with fractional seconds', () => {
      const original = CborDate.fromTimestamp(1647885871.5);
      const tagged = original.taggedCbor();
      const decoded = CborDate.fromTaggedCborStatic(tagged);

      expect(decoded.timestamp()).toBe(original.timestamp());
    });

    test('round-trip with negative timestamp', () => {
      const original = CborDate.fromTimestamp(-1000);
      const tagged = original.taggedCbor();
      const decoded = CborDate.fromTaggedCborStatic(tagged);

      expect(decoded.timestamp()).toBe(original.timestamp());
    });

    test('round-trip with current time', () => {
      const original = CborDate.now();
      const tagged = original.taggedCbor();
      const decoded = CborDate.fromTaggedCborStatic(tagged);

      // Timestamps should match within millisecond precision
      const diff = Math.abs(decoded.timestamp() - original.timestamp());
      expect(diff).toBeLessThan(0.001);
    });
  });

  describe('Arithmetic Operations', () => {
    test('adds seconds', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const oneDayLater = date.add(24 * 60 * 60);

      const originalDay = date.getDate().getUTCDate();
      const newDay = oneDayLater.getDate().getUTCDate();
      expect(newDay).toBe(originalDay + 1);
    });

    test('adds fractional seconds', () => {
      const date = CborDate.fromTimestamp(1000);
      const later = date.add(0.5);

      expect(later.timestamp()).toBe(1000.5);
    });

    test('subtracts seconds', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const oneDayEarlier = date.subtract(24 * 60 * 60);

      const originalDay = date.getDate().getUTCDate();
      const newDay = oneDayEarlier.getDate().getUTCDate();
      expect(newDay).toBe(originalDay - 1);
    });

    test('calculates difference', () => {
      const date1 = CborDate.fromYMD(2022, 3, 22);
      const date2 = CborDate.fromYMD(2022, 3, 21);

      const diff = date1.difference(date2);
      expect(diff).toBe(24 * 60 * 60); // One day in seconds
    });

    test('difference is negative for earlier date', () => {
      const date1 = CborDate.fromYMD(2022, 3, 21);
      const date2 = CborDate.fromYMD(2022, 3, 22);

      const diff = date1.difference(date2);
      expect(diff).toBe(-24 * 60 * 60);
    });

    test('difference is zero for same date', () => {
      const date1 = CborDate.fromTimestamp(12345);
      const date2 = CborDate.fromTimestamp(12345);

      const diff = date1.difference(date2);
      expect(diff).toBe(0);
    });
  });

  describe('Display and Formatting', () => {
    test('toString shows only date for midnight', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const str = date.toString();

      expect(str).toBe('2022-03-21');
    });

    test('toString shows full datetime for non-midnight', () => {
      const date = CborDate.fromYMDHMS(2022, 3, 21, 18, 24, 31);
      const str = date.toString();

      expect(str).toContain('2022-03-21');
      expect(str).toContain('18:24:31');
    });

    test('toJSON returns ISO string', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const json = date.toJSON();

      expect(json).toBe('2022-03-21');
    });

    test('equals compares timestamps', () => {
      const date1 = CborDate.fromTimestamp(12345);
      const date2 = CborDate.fromTimestamp(12345);
      const date3 = CborDate.fromTimestamp(12346);

      expect(date1.equals(date2)).toBe(true);
      expect(date1.equals(date3)).toBe(false);
    });

    test('compare returns correct values', () => {
      const earlier = CborDate.fromTimestamp(1000);
      const later = CborDate.fromTimestamp(2000);
      const same = CborDate.fromTimestamp(1000);

      expect(earlier.compare(later)).toBe(-1);
      expect(later.compare(earlier)).toBe(1);
      expect(earlier.compare(same)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles year 2000', () => {
      const y2k = CborDate.fromYMD(2000, 1, 1);
      expect(y2k.getDate().getUTCFullYear()).toBe(2000);
    });

    test('handles year 1970', () => {
      const epoch = CborDate.fromYMD(1970, 1, 1);
      expect(epoch.timestamp()).toBe(0);
    });

    test('handles dates before 1970', () => {
      const before = CborDate.fromYMD(1969, 12, 31);
      expect(before.timestamp()).toBeLessThan(0);
    });

    test('handles very large timestamps', () => {
      const large = CborDate.fromTimestamp(2147483647); // 2038-01-19
      expect(large.timestamp()).toBe(2147483647);
    });

    test('handles very small timestamps', () => {
      const small = CborDate.fromTimestamp(-2147483648);
      expect(small.timestamp()).toBe(-2147483648);
    });

    test('handles millisecond precision', () => {
      const precise = CborDate.fromTimestamp(1234567890.123);
      const decoded = CborDate.fromTaggedCborStatic(precise.taggedCbor());

      const diff = Math.abs(decoded.timestamp() - precise.timestamp());
      expect(diff).toBeLessThan(0.0001);
    });
  });

  describe('Integration Tests', () => {
    test('works with getDate for calendar operations', () => {
      const date = CborDate.fromYMD(2022, 3, 21);
      const jsDate = date.getDate();

      expect(jsDate.getUTCFullYear()).toBe(2022);
      expect(jsDate.getUTCMonth() + 1).toBe(3); // Convert 0-indexed to 1-indexed
      expect(jsDate.getUTCDate()).toBe(21);
    });

    test('can be used in Date operations', () => {
      const cborDate = CborDate.fromYMD(2022, 3, 21);
      const jsDate = cborDate.getDate();
      const dayOfWeek = jsDate.getUTCDay();

      expect(dayOfWeek).toBe(1); // Monday
    });

    test('preserves timezone (always UTC)', () => {
      const date = CborDate.fromYMDHMS(2022, 3, 21, 12, 0, 0);
      const jsDate = date.getDate();

      // Regardless of local timezone, should be UTC
      expect(jsDate.getUTCHours()).toBe(12);
    });
  });
});
