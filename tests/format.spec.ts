// Translation of bc-dcbor-rust/tests/format.rs
// Tests diagnostic formatting output to ensure 1:1 match with Rust implementation

import { describe, test, expect } from '@jest/globals';
import { cbor } from '../src/encode';
import { Cbor } from '../src/cbor';
import { diagnostic, diagnosticAnnotated, diagnosticFlat, summary } from '../src/diag';
import { cborDebug, cborDiagnostic } from '../src/debug';
import { bytesToHex, hexToBytes } from '../src/data-utils';
import { cborData } from '../src/encode';
import { CborMap } from '../src/map';
import { CborDate } from '../src/date';
import { decodeCbor } from '../src/decode';

// Helper function to test all format variants
function runFormatTest(
  testName: string,
  value: Cbor,
  expectedDescription: string,
  expectedDebugDescription: string,
  expectedDiagnostic: string,
  expectedDiagnosticAnnotated: string,
  expectedDiagnosticFlat: string,
  expectedSummary: string,
  expectedHex: string,
  expectedHexAnnotated: string
) {
  // Test Display format (equivalent to Rust's ToString)
  const description = cborDiagnostic(value);
  expect(description).toBe(expectedDescription);

  // Test Debug format
  const debugDescription = cborDebug(value);
  expect(debugDescription).toBe(expectedDebugDescription);

  // Test diagnostic
  const diag = diagnostic(value);
  expect(diag).toBe(expectedDiagnostic);

  // Test diagnostic_annotated
  const diagAnnotated = diagnosticAnnotated(value);
  expect(diagAnnotated).toBe(expectedDiagnosticAnnotated);

  // Test diagnostic_flat
  const diagFlat = diagnosticFlat(value);
  expect(diagFlat).toBe(expectedDiagnosticFlat);

  // Test summary
  const sum = summary(value);
  expect(sum).toBe(expectedSummary);

  // Test hex encoding
  const hex = bytesToHex(cborData(value));
  expect(hex).toBe(expectedHex);

  // Test hex_annotated
  // TODO: Implement hex_annotated if needed
  // For now we'll skip this test as it's not implemented in TypeScript
}

describe('Format Tests', () => {
  test('format_simple_1 - false', () => {
    runFormatTest(
      'format_simple_1',
      Cbor.False,
      'false',
      'simple(false)',
      'false',
      'false',
      'false',
      'false',
      'f4',
      'f4  # false'
    );
  });

  test('format_simple_2 - true', () => {
    runFormatTest(
      'format_simple_2',
      Cbor.True,
      'true',
      'simple(true)',
      'true',
      'true',
      'true',
      'true',
      'f5',
      'f5  # true'
    );
  });

  test('format_simple_3 - null', () => {
    runFormatTest(
      'format_simple_3',
      Cbor.Null,
      'null',
      'simple(null)',
      'null',
      'null',
      'null',
      'null',
      'f6',
      'f6  # null'
    );
  });

  test('format_unsigned - various sizes', () => {
    runFormatTest(
      'format_unsigned_0',
      cbor(0),
      '0',
      'unsigned(0)',
      '0',
      '0',
      '0',
      '0',
      '00',
      '00  # unsigned(0)'
    );

    runFormatTest(
      'format_unsigned_23',
      cbor(23),
      '23',
      'unsigned(23)',
      '23',
      '23',
      '23',
      '23',
      '17',
      '17  # unsigned(23)'
    );

    runFormatTest(
      'format_unsigned_65546',
      cbor(65546),
      '65546',
      'unsigned(65546)',
      '65546',
      '65546',
      '65546',
      '65546',
      '1a0001000a',
      '1a0001000a  # unsigned(65546)'
    );

    runFormatTest(
      'format_unsigned_1000000000',
      cbor(1000000000),
      '1000000000',
      'unsigned(1000000000)',
      '1000000000',
      '1000000000',
      '1000000000',
      '1000000000',
      '1a3b9aca00',
      '1a3b9aca00  # unsigned(1000000000)'
    );
  });

  test('format_negative - various sizes', () => {
    runFormatTest(
      'format_negative_neg1',
      cbor(-1),
      '-1',
      'negative(-1)',
      '-1',
      '-1',
      '-1',
      '-1',
      '20',
      '20  # negative(-1)'
    );

    runFormatTest(
      'format_negative_neg1000',
      cbor(-1000),
      '-1000',
      'negative(-1000)',
      '-1000',
      '-1000',
      '-1000',
      '-1000',
      '3903e7',
      '3903e7  # negative(-1000)'
    );

    runFormatTest(
      'format_negative_neg1000000',
      cbor(-1000000),
      '-1000000',
      'negative(-1000000)',
      '-1000000',
      '-1000000',
      '-1000000',
      '-1000000',
      '3a000f423f',
      '3a000f423f  # negative(-1000000)'
    );
  });

  test('format_string', () => {
    runFormatTest(
      'format_string',
      cbor('Test'),
      '"Test"',
      'text("Test")',
      '"Test"',
      '"Test"',
      '"Test"',
      '"Test"',
      '6454657374',
      '64              # text(4)\n    54657374    # "Test"'
    );
  });

  test('format_simple_array', () => {
    runFormatTest(
      'format_simple_array',
      cbor([1, 2, 3]),
      '[1, 2, 3]',
      'array([unsigned(1), unsigned(2), unsigned(3)])',
      '[1, 2, 3]',
      '[1, 2, 3]',
      '[1, 2, 3]',
      '[1, 2, 3]',
      '83010203',
      '83      # array(3)\n    01  # unsigned(1)\n    02  # unsigned(2)\n    03  # unsigned(3)'
    );
  });

  test('format_nested_array', () => {
    const a = cbor([1, 2, 3]);
    const b = cbor(['A', 'B', 'C']);
    const c = cbor([a, b]);

    runFormatTest(
      'format_nested_array',
      c,
      '[[1, 2, 3], ["A", "B", "C"]]',
      'array([array([unsigned(1), unsigned(2), unsigned(3)]), array([text("A"), text("B"), text("C")])])',
      `[
    [1, 2, 3],
    ["A", "B", "C"]
]`,
      `[
    [1, 2, 3],
    ["A", "B", "C"]
]`,
      '[[1, 2, 3], ["A", "B", "C"]]',
      '[[1, 2, 3], ["A", "B", "C"]]',
      '828301020383614161426143',
      `82              # array(2)
    83          # array(3)
        01      # unsigned(1)
        02      # unsigned(2)
        03      # unsigned(3)
    83          # array(3)
        61      # text(1)
            41  # "A"
        61      # text(1)
            42  # "B"
        61      # text(1)
            43  # "C"`
    );
  });

  test('format_map', () => {
    const map = new CborMap();
    map.set(1, 'A');
    map.set(2, 'B');
    const value = cbor(map);

    runFormatTest(
      'format_map',
      value,
      '{1: "A", 2: "B"}',
      'map({0x01: (unsigned(1), text("A")), 0x02: (unsigned(2), text("B"))})',
      '{1: "A", 2: "B"}',
      '{1: "A", 2: "B"}',
      '{1: "A", 2: "B"}',
      '{1: "A", 2: "B"}',
      'a2016141026142',
      `a2          # map(2)
    01      # unsigned(1)
    61      # text(1)
        41  # "A"
    02      # unsigned(2)
    61      # text(1)
        42  # "B"`
    );
  });

  test('format_tagged', () => {
    const a: Cbor = { isCbor: true, type: 6, tag: 100n, value: cbor('Hello') };

    runFormatTest(
      'format_tagged',
      a,
      '100("Hello")',
      'tagged(100, text("Hello"))',
      '100("Hello")',
      '100("Hello")',
      '100("Hello")',
      '100("Hello")',
      'd8646548656c6c6f',
      `d8 64               # tag(100)
    65              # text(5)
        48656c6c6f  # "Hello"`
    );
  });

  test('format_date', () => {
    const dateNeg = cbor(CborDate.fromTimestamp(-100));
    runFormatTest(
      'format_date_negative',
      dateNeg,
      'date(-100)',
      'tagged(date, negative(-100))',
      '1(-100)',
      '1(-100)   / date /',
      '1(-100)',
      '1969-12-31T23:58:20Z',
      'c13863',
      `c1          # tag(1) date
    3863    # negative(-100)`
    );

    const datePos = cbor(CborDate.fromTimestamp(1647887071));
    runFormatTest(
      'format_date_positive',
      datePos,
      'date(1647887071)',
      'tagged(date, unsigned(1647887071))',
      '1(1647887071)',
      '1(1647887071)   / date /',
      '1(1647887071)',
      '2022-03-21T18:24:31Z',
      'c11a6238c2df',
      `c1              # tag(1) date
    1a6238c2df  # unsigned(1647887071)`
    );
  });

  test('format_fractional_date', () => {
    const dateFrac = cbor(CborDate.fromTimestamp(0.5));

    runFormatTest(
      'format_fractional_date',
      dateFrac,
      'date(0.5)',
      'tagged(date, simple(0.5))',
      '1(0.5)',
      '1(0.5)   / date /',
      '1(0.5)',
      '1970-01-01',
      'c1f93800',
      `c1          # tag(1) date
    f93800  # 0.5`
    );
  });

  test('format_key_order', () => {
    const m = new CborMap();
    m.set(-1, 3);
    m.set([-1], 7);
    m.set('z', 4);
    m.set(10, 1);
    m.set(false, 8);
    m.set(100, 2);
    m.set('aa', 5);
    m.set([100], 6);

    const value = cbor(m);

    runFormatTest(
      'format_key_order',
      value,
      '{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}',
      'map({0x0a: (unsigned(10), unsigned(1)), 0x1864: (unsigned(100), unsigned(2)), 0x20: (negative(-1), unsigned(3)), 0x617a: (text("z"), unsigned(4)), 0x626161: (text("aa"), unsigned(5)), 0x811864: (array([unsigned(100)]), unsigned(6)), 0x8120: (array([negative(-1)]), unsigned(7)), 0xf4: (simple(false), unsigned(8))})',
      `{
    10:
    1,
    100:
    2,
    -1:
    3,
    "z":
    4,
    "aa":
    5,
    [100]:
    6,
    [-1]:
    7,
    false:
    8
}`,
      `{
    10:
    1,
    100:
    2,
    -1:
    3,
    "z":
    4,
    "aa":
    5,
    [100]:
    6,
    [-1]:
    7,
    false:
    8
}`,
      '{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}',
      '{10: 1, 100: 2, -1: 3, "z": 4, "aa": 5, [100]: 6, [-1]: 7, false: 8}',
      'a80a011864022003617a046261610581186406812007f408',
      `a8              # map(8)
    0a          # unsigned(10)
    01          # unsigned(1)
    1864        # unsigned(100)
    02          # unsigned(2)
    20          # negative(-1)
    03          # unsigned(3)
    61          # text(1)
        7a      # "z"
    04          # unsigned(4)
    62          # text(2)
        6161    # "aa"
    05          # unsigned(5)
    81          # array(1)
        1864    # unsigned(100)
    06          # unsigned(6)
    81          # array(1)
        20      # negative(-1)
    07          # unsigned(7)
    f4          # false
    08          # unsigned(8)`
    );
  });

  test('format_structure', () => {
    const encodedCborHex = 'd83183015829536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e82d902c3820158402b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710ad902c3820158400f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900';
    const cborValue = decodeCbor(hexToBytes(encodedCborHex));

    const description = "49([1, h'536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e', [707([1, h'2b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710a']), 707([1, h'0f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900'])]])";
    const debugDescription = "tagged(49, array([unsigned(1), bytes(536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e), array([tagged(707, array([unsigned(1), bytes(2b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710a)])), tagged(707, array([unsigned(1), bytes(0f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900)]))])]))";
    const diagnosticStr = `49(
    [
        1,
        h'536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e',
        [
            707(
                [
                    1,
                    h'2b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710a'
                ]
            ),
            707(
                [
                    1,
                    h'0f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900'
                ]
            )
        ]
    ]
)`;
    const diagnosticFlat = "49([1, h'536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e', [707([1, h'2b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710a']), 707([1, h'0f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900'])]])";
    const hexAnnotated = `d8 31                                   # tag(49)
    83                                  # array(3)
        01                              # unsigned(1)
        5829                            # bytes(41)
            536f6d65206d7973746572696573206172656e2774206d65616e7420746f20626520736f6c7665642e # "Some mysteries aren't meant to be solved."
        82                              # array(2)
            d9 02c3                     # tag(707)
                82                      # array(2)
                    01                  # unsigned(1)
                    5840                # bytes(64)
                        2b9238e19eafbc154b49ec89edd4e0fb1368e97332c6913b4beb637d1875824f3e43bd7fb0c41fb574f08ce00247413d3ce2d9466e0ccfa4a89b92504982710a
            d9 02c3                     # tag(707)
                82                      # array(2)
                    01                  # unsigned(1)
                    5840                # bytes(64)
                        0f9c7af36804ffe5313c00115e5a31aa56814abaa77ff301da53d48613496e9c51a98b36d55f6fb5634fdb0123910cfa4904f1c60523df41013dc3749b377900`;

    runFormatTest(
      'format_structure',
      cborValue,
      description,
      debugDescription,
      diagnosticStr,
      diagnosticStr,
      diagnosticFlat,
      diagnosticFlat,
      encodedCborHex,
      hexAnnotated
    );
  });

  test('format_structure_2', () => {
    const encodedCborHex = 'd9012ca4015059f2293a5bce7d4de59e71b4207ac5d202c11a6035970003754461726b20507572706c652041717561204c6f766504787b4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742c2073656420646f20656975736d6f642074656d706f7220696e6369646964756e74207574206c61626f726520657420646f6c6f7265206d61676e6120616c697175612e';
    const cborValue = decodeCbor(hexToBytes(encodedCborHex));

    const description = `300({1: h'59f2293a5bce7d4de59e71b4207ac5d2', 2: 1(1614124800), 3: "Dark Purple Aqua Love", 4: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."})`;
    const debugDescription = `tagged(300, map({0x01: (unsigned(1), bytes(59f2293a5bce7d4de59e71b4207ac5d2)), 0x02: (unsigned(2), tagged(1, unsigned(1614124800))), 0x03: (unsigned(3), text("Dark Purple Aqua Love")), 0x04: (unsigned(4), text("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."))}))`;
    const diagnosticStr = `300(
    {
        1:
        h'59f2293a5bce7d4de59e71b4207ac5d2',
        2:
        1(1614124800),
        3:
        "Dark Purple Aqua Love",
        4:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    }
)`;
    const diagnosticAnnotated = `300(
    {
        1:
        h'59f2293a5bce7d4de59e71b4207ac5d2',
        2:
        1(1614124800),   / date /
        3:
        "Dark Purple Aqua Love",
        4:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    }
)`;
    const diagnosticFlat = `300({1: h'59f2293a5bce7d4de59e71b4207ac5d2', 2: 1(1614124800), 3: "Dark Purple Aqua Love", 4: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."})`;
    const summaryStr = `300({1: h'59f2293a5bce7d4de59e71b4207ac5d2', 2: 2021-02-24, 3: "Dark Purple Aqua Love", 4: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."})`;
    const hexAnnotated = `d9 012c                                 # tag(300)
    a4                                  # map(4)
        01                              # unsigned(1)
        50                              # bytes(16)
            59f2293a5bce7d4de59e71b4207ac5d2
        02                              # unsigned(2)
        c1                              # tag(1) date
            1a60359700                  # unsigned(1614124800)
        03                              # unsigned(3)
        75                              # text(21)
            4461726b20507572706c652041717561204c6f7665 # "Dark Purple Aqua Love"
        04                              # unsigned(4)
        78 7b                           # text(123)
            4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742c2073656420646f20656975736d6f642074656d706f7220696e6369646964756e74207574206c61626f726520657420646f6c6f7265206d61676e6120616c697175612e # "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."`;

    runFormatTest(
      'format_structure_2',
      cborValue,
      description,
      debugDescription,
      diagnosticStr,
      diagnosticAnnotated,
      diagnosticFlat,
      summaryStr,
      encodedCborHex,
      hexAnnotated
    );
  });
});
