/**
 * Tests for enhanced diagnostic formatting.
 */

import {
  diagnostic,
  diagnosticOpt,
  diagnosticAnnotated,
  diagnosticFlat,
  summary,
  prettyDiagnostic,
  fullDiagnostic,
  compactDiagnostic,
  DiagFormatOpts
} from './diag';
import { cbor } from './encode';
import { MajorType } from './cbor';
import { CborDate } from './date';
import { CborSet } from './set';
import { getGlobalTagsStore, TagsStore } from './tags-store';
import { createTag } from './tag';

describe('Diagnostic Formatting Tests', () => {
  describe('Basic Diagnostic Formatting', () => {
    test('formats unsigned integers', () => {
      expect(diagnostic(cbor(0))).toBe('0');
      expect(diagnostic(cbor(42))).toBe('42');
      expect(diagnostic(cbor(1234567890))).toBe('1234567890');
      expect(diagnostic(cbor(BigInt('18446744073709551615')))).toBe('18446744073709551615');
    });

    test('formats negative integers', () => {
      expect(diagnostic(cbor(-1))).toBe('-1');
      expect(diagnostic(cbor(-100))).toBe('-100');
      expect(diagnostic(cbor(-9876543210))).toBe('-9876543210');
    });

    test('formats byte strings', () => {
      expect(diagnostic(cbor(new Uint8Array([])))).toBe("h''");
      expect(diagnostic(cbor(new Uint8Array([0x01, 0x02, 0x03])))).toBe("h'010203'");
      expect(diagnostic(cbor(new Uint8Array([0xde, 0xad, 0xbe, 0xef])))).toBe("h'deadbeef'");
    });

    test('formats text strings', () => {
      expect(diagnostic(cbor(''))).toBe('""');
      expect(diagnostic(cbor('hello'))).toBe('"hello"');
      expect(diagnostic(cbor('Hello, World!'))).toBe('"Hello, World!"');
    });

    test('escapes special characters in text', () => {
      expect(diagnostic(cbor('line\nbreak'))).toBe('"line\\nbreak"');
      expect(diagnostic(cbor('tab\there'))).toBe('"tab\\there"');
      expect(diagnostic(cbor('quote"here'))).toBe('"quote\\"here"');
      expect(diagnostic(cbor('back\\slash'))).toBe('"back\\\\slash"');
      expect(diagnostic(cbor('carriage\rreturn'))).toBe('"carriage\\rreturn"');
    });

    test('formats simple values', () => {
      expect(diagnostic(cbor(true))).toBe('true');
      expect(diagnostic(cbor(false))).toBe('false');
      expect(diagnostic(cbor(null))).toBe('null');
    });

    test('formats floats', () => {
      expect(diagnostic(cbor(3.14))).toContain('3.14');
      expect(diagnostic(cbor(0.0))).toBe('0'); // 0.0 is encoded as integer 0
      expect(diagnostic(cbor(-2.5))).toBe('-2.5');
    });

    test('formats special float values', () => {
      expect(diagnostic(cbor(NaN))).toBe('NaN');
      expect(diagnostic(cbor(Infinity))).toBe('Infinity');
      expect(diagnostic(cbor(-Infinity))).toBe('-Infinity');
    });

    test('formats empty arrays', () => {
      expect(diagnostic(cbor([]))).toBe('[]');
    });

    test('formats simple arrays', () => {
      expect(diagnostic(cbor([1, 2, 3]))).toContain('1');
      expect(diagnostic(cbor([1, 2, 3]))).toContain('2');
      expect(diagnostic(cbor([1, 2, 3]))).toContain('3');
    });

    test('formats arrays with mixed types', () => {
      const diag = diagnostic(cbor([1, 'hello', true, null]));
      expect(diag).toContain('1');
      expect(diag).toContain('"hello"');
      expect(diag).toContain('true');
      expect(diag).toContain('null');
    });
  });

  describe('Flat Formatting', () => {
    test('formats arrays on single line', () => {
      const result = diagnosticFlat(cbor([1, 2, 3]));
      expect(result).toBe('[1, 2, 3]');
      expect(result).not.toContain('\n');
    });

    test('formats nested arrays on single line', () => {
      const result = diagnosticFlat(cbor([[1, 2], [3, 4]]));
      expect(result).toBe('[[1, 2], [3, 4]]');
      expect(result).not.toContain('\n');
    });

    test('formats empty array', () => {
      const result = diagnosticFlat(cbor([]));
      expect(result).toBe('[]');
    });
  });

  describe('Pretty Formatting', () => {
    test('formats arrays with line breaks', () => {
      const result = prettyDiagnostic(cbor([1, 2, 3]));
      expect(result).toContain('\n');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    test('formats nested arrays with indentation', () => {
      const result = prettyDiagnostic(cbor([[1, 2], [3, 4]]));
      expect(result).toContain('\n');
      // Should have indentation
      expect(result.split('\n').length).toBeGreaterThan(2);
    });

    test('empty array stays on one line', () => {
      const result = prettyDiagnostic(cbor([]));
      expect(result).toBe('[]');
    });
  });

  describe('Tagged Value Formatting', () => {
    test('formats tagged values with numeric tags', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 42,
        value: cbor(123)
      };
      const result = diagnostic(tagged);
      expect(result).toBe('42(123)');
    });

    test('formats nested tagged values', () => {
      const inner = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(100)
      };
      const outer = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 2,
        value: inner
      };
      const result = diagnostic(outer);
      expect(result).toBe('2(1(100))');
    });

    test('formats tagged arrays', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 258,
        value: cbor([1, 2, 3])
      };
      const result = diagnosticFlat(tagged);
      expect(result).toContain('258');
      expect(result).toContain('1, 2, 3');
    });
  });

  describe('Annotated Formatting', () => {
    test('formats standard tags with names', () => {
      // Tag 1 is epoch date-time
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(1234567890)
      };
      const result = diagnosticAnnotated(tagged);
      expect(result).toContain('date');
      expect(result).toContain('1234567890');
    });

    test('formats set tag with name', () => {
      // Tag 258 is set
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 258,
        value: cbor([1, 2, 3])
      };
      const result = diagnosticAnnotated(tagged);
      expect(result).toContain('set');
    });

    test('formats unknown tags with numeric value', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 99999,
        value: cbor(123)
      };
      const result = diagnosticAnnotated(tagged);
      expect(result).toContain('99999');
    });
  });

  describe('Integration with CborDate', () => {
    test('formats CborDate diagnostic', () => {
      const date = CborDate.fromTimestamp(1234567890);
      const tagged = date.taggedCbor();
      const result = diagnostic(tagged);

      expect(result).toContain('1');
      expect(result).toContain('1234567890');
    });

    test('formats CborDate with annotation', () => {
      const date = CborDate.fromTimestamp(1234567890);
      const tagged = date.taggedCbor();
      const result = diagnosticAnnotated(tagged);

      expect(result).toContain('date');
      expect(result).toContain('1234567890');
    });

    test('formats CborDate with fractional seconds', () => {
      const date = CborDate.fromTimestamp(1234567890.5);
      const tagged = date.taggedCbor();
      const result = diagnostic(tagged);

      expect(result).toContain('1234567890.5');
    });
  });

  describe('Integration with CborSet', () => {
    test('formats CborSet diagnostic', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const tagged = set.taggedCbor();
      const result = diagnosticFlat(tagged);

      expect(result).toContain('258');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    test('formats CborSet with annotation', () => {
      const set = CborSet.fromArray([1, 2, 3]);
      const tagged = set.taggedCbor();
      const result = diagnosticAnnotated(tagged);

      expect(result).toContain('set');
    });
  });

  describe('Format Options', () => {
    test('respects flat option', () => {
      const value = cbor([1, 2, 3]);
      const flat = diagnosticOpt(value, { flat: true });
      const pretty = diagnosticOpt(value, { flat: false });

      expect(flat).not.toContain('\n');
      expect(pretty).toContain('\n');
    });

    test('respects annotate option', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(123)
      };

      const plain = diagnosticOpt(tagged, { annotate: false });
      const annotated = diagnosticOpt(tagged, { annotate: true });

      expect(plain).toBe('1(123)');
      expect(annotated).toContain('date');
    });

    test('handles tags=none option', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(123)
      };

      const result = diagnosticOpt(tagged, { annotate: true, tags: 'none' });
      expect(result).toBe('1(123)'); // Should use numeric tag, not name
    });

    test('handles custom tags store', () => {
      const customStore = new TagsStore();
      customStore.insert(createTag(999, 'custom'));

      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 999,
        value: cbor(123)
      };

      const result = diagnosticOpt(tagged, { annotate: true, tags: customStore });
      expect(result).toContain('custom');
    });
  });

  describe('Convenience Functions', () => {
    test('fullDiagnostic enables annotation', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(123)
      };

      const result = fullDiagnostic(tagged);
      expect(result).toContain('date');
    });

    test('compactDiagnostic is flat and annotated', () => {
      const value = cbor([1, 2, 3]);
      const result = compactDiagnostic(value);

      expect(result).toBe('[1, 2, 3]');
      expect(result).not.toContain('\n');
    });

    test('prettyDiagnostic formats with line breaks', () => {
      const value = cbor([1, 2, 3]);
      const result = prettyDiagnostic(value);

      expect(result).toContain('\n');
    });

    test('prettyDiagnostic with annotation', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(123)
      };

      const result = prettyDiagnostic(tagged, true);
      expect(result).toContain('date');
    });
  });

  describe('Nested Structures', () => {
    test('formats deeply nested arrays', () => {
      const nested = cbor([1, [2, [3, [4, [5]]]]]);
      const result = diagnosticFlat(nested);

      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain('4');
      expect(result).toContain('5');
    });

    test('formats mixed nested structures', () => {
      const complex = cbor([
        1,
        'text',
        [2, 3],
        true,
        new Uint8Array([0x01, 0x02])
      ]);

      const result = diagnosticFlat(complex);
      expect(result).toContain('1');
      expect(result).toContain('"text"');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain('true');
      expect(result).toContain("h'0102'");
    });

    test('pretty formats nested with proper indentation', () => {
      const nested = cbor([[1, 2], [3, 4]]);
      const result = prettyDiagnostic(nested);

      expect(result).toContain('\n');
      // Should have multiple levels of indentation
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(3);
    });
  });

  describe('Edge Cases', () => {
    test('handles very large integers', () => {
      const large = BigInt('18446744073709551615');
      const result = diagnostic(cbor(large));
      expect(result).toBe('18446744073709551615');
    });

    test('handles empty strings', () => {
      expect(diagnostic(cbor(''))).toBe('""');
    });

    test('handles strings with only spaces', () => {
      expect(diagnostic(cbor('   '))).toBe('"   "');
    });

    test('handles empty byte strings', () => {
      expect(diagnostic(cbor(new Uint8Array([])))).toBe("h''");
    });

    test('handles unicode strings', () => {
      const result = diagnostic(cbor('Hello 世界 🌍'));
      expect(result).toContain('Hello 世界 🌍');
    });

    test('handles all escape sequences', () => {
      const special = 'a\nb\tc\rd"e\\f';
      const result = diagnostic(cbor(special));
      expect(result).toBe('"a\\nb\\tc\\rd\\"e\\\\f"');
    });
  });

  describe('Summarizer Support', () => {
    test('uses summarizer when available', () => {
      const store = new TagsStore();
      store.insert(createTag(999, 'custom'));
      store.setSummarizer(999, (cbor, flat) => '<summary>');

      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 999,
        value: cbor(123)
      };

      const result = diagnosticOpt(tagged, {
        summarize: true,
        tags: store
      });

      expect(result).toBe('<summary>');
    });

    test('falls back to normal formatting without summarizer', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 999,
        value: cbor(123)
      };

      const result = diagnosticOpt(tagged, { summarize: true });
      expect(result).toContain('999');
      expect(result).toContain('123');
    });

    test('summary() function enables summarizer', () => {
      const store = getGlobalTagsStore();
      store.insert(createTag(888, 'test'));
      store.setSummarizer(888, () => '<test-summary>');

      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 888,
        value: cbor('content')
      };

      const result = summary(tagged);
      expect(result).toBe('<test-summary>');
    });
  });

  describe('Float Formatting', () => {
    test('formats floats with decimal parts', () => {
      const result = diagnostic(cbor(42.5));
      expect(result).toContain('42.5');
    });

    test('formats negative floats', () => {
      const result = diagnostic(cbor(-3.14));
      expect(result).toContain('-3.14');
    });

    test('formats very small floats', () => {
      const result = diagnostic(cbor(0.000001));
      expect(result).toContain('0.000001');
    });

    test('formats large numbers', () => {
      const result = diagnostic(cbor(1.23e10));
      // Large numbers may be formatted as integer or scientific notation
      expect(result).toMatch(/12300000000|1\.23e\+?10/);
    });

    test('whole numbers are formatted as integers', () => {
      const result = diagnostic(cbor(42.0));
      expect(result).toBe('42');
    });
  });

  describe('Consistency Tests', () => {
    test('diagnostic and diagnosticOpt with defaults are equivalent', () => {
      const value = cbor([1, 2, 3]);
      expect(diagnostic(value)).toBe(diagnosticOpt(value));
    });

    test('diagnosticFlat and diagnosticOpt with flat:true are equivalent', () => {
      const value = cbor([1, 2, 3]);
      expect(diagnosticFlat(value)).toBe(diagnosticOpt(value, { flat: true }));
    });

    test('diagnosticAnnotated and diagnosticOpt with annotate:true are equivalent', () => {
      const tagged = {
        isCbor: true as const,
        type: MajorType.Tagged as MajorType.Tagged,
        tag: 1,
        value: cbor(123)
      };
      expect(diagnosticAnnotated(tagged)).toBe(diagnosticOpt(tagged, { annotate: true }));
    });
  });
});
