/**
 * Performance benchmarking suite for bc-dcbor-ts.
 *
 * Benchmarks core CBOR operations to track performance and identify
 * optimization opportunities.
 *
 * @module benchmark
 */

import { cbor, encodeCbor } from './encode';
import { decodeCbor } from './decode';
import { CborMap } from './map';
import { CborDate } from './date';
import { CborSet } from './set';

/**
 * Benchmark result for a single test.
 */
export interface BenchmarkResult {
  name: string;
  operations: number;
  totalTimeMs: number;
  avgTimeUs: number;
  opsPerSec: number;
}

/**
 * Suite of benchmark results.
 */
export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  timestamp: Date;
}

/**
 * Run a benchmark function multiple times and measure performance.
 *
 * @param name - Name of the benchmark
 * @param fn - Function to benchmark
 * @param iterations - Number of iterations (default: 10000)
 * @returns Benchmark result
 */
export function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 10000
): BenchmarkResult {
  // Warm up
  for (let i = 0; i < Math.min(100, iterations / 10); i++) {
    fn();
  }

  // Run benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalTimeMs = end - start;
  const avgTimeUs = (totalTimeMs * 1000) / iterations;
  const opsPerSec = iterations / (totalTimeMs / 1000);

  return {
    name,
    operations: iterations,
    totalTimeMs,
    avgTimeUs,
    opsPerSec,
  };
}

/**
 * Run encoding benchmarks.
 */
export function benchmarkEncoding(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const iterations = 5000; // Reduced for reasonable execution time

  // Unsigned integers
  results.push(
    benchmark('encode unsigned (small)', () => {
      encodeCbor(cbor(42));
    }, iterations)
  );

  results.push(
    benchmark('encode unsigned (large)', () => {
      encodeCbor(cbor(1234567890123456789n));
    }, iterations)
  );

  // Negative integers
  results.push(
    benchmark('encode negative', () => {
      encodeCbor(cbor(-42));
    }, iterations)
  );

  // Text strings
  results.push(
    benchmark('encode text (short)', () => {
      encodeCbor(cbor('Hello'));
    }, iterations)
  );

  results.push(
    benchmark('encode text (long)', () => {
      encodeCbor(cbor('A'.repeat(1000)));
    }, iterations)
  );

  // Byte strings
  results.push(
    benchmark('encode bytes (small)', () => {
      encodeCbor(cbor(new Uint8Array([1, 2, 3, 4, 5])));
    }, iterations)
  );

  results.push(
    benchmark('encode bytes (large)', () => {
      encodeCbor(cbor(new Uint8Array(1000)));
    }, iterations)
  );

  // Arrays
  results.push(
    benchmark('encode array (small)', () => {
      encodeCbor(cbor([1, 2, 3, 4, 5]));
    }, iterations)
  );

  results.push(
    benchmark('encode array (large)', () => {
      encodeCbor(cbor(Array.from({ length: 100 }, (_, i) => i)));
    }, iterations)
  );

  // Maps
  const smallMap = new CborMap();
  smallMap.set('a', 1);
  smallMap.set('b', 2);
  smallMap.set('c', 3);

  results.push(
    benchmark('encode map (small)', () => {
      encodeCbor(cbor(smallMap));
    }, iterations)
  );

  const largeMap = new CborMap();
  for (let i = 0; i < 100; i++) {
    largeMap.set(`key${i}`, i);
  }

  results.push(
    benchmark('encode map (large)', () => {
      encodeCbor(cbor(largeMap));
    }, iterations)
  );

  // Tagged values
  results.push(
    benchmark('encode tagged (date)', () => {
      const date = new CborDate();
      encodeCbor(date.taggedCbor());
    }, iterations)
  );

  results.push(
    benchmark('encode tagged (set)', () => {
      const set = CborSet.fromArray([1, 2, 3, 4, 5]);
      encodeCbor(set.taggedCbor());
    }, iterations)
  );

  // Simple values
  results.push(
    benchmark('encode simple (boolean)', () => {
      encodeCbor(cbor(true));
    }, iterations)
  );

  results.push(
    benchmark('encode simple (null)', () => {
      encodeCbor(cbor(null));
    }, iterations)
  );

  // Floats
  results.push(
    benchmark('encode float32', () => {
      encodeCbor(cbor(3.14159));
    }, iterations)
  );

  results.push(
    benchmark('encode float64', () => {
      encodeCbor(cbor(Math.PI));
    }, iterations)
  );

  return results;
}

/**
 * Run decoding benchmarks.
 */
export function benchmarkDecoding(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const iterations = 5000; // Reduced for reasonable execution time

  // Pre-encode test data
  const smallUnsigned = encodeCbor(cbor(42));
  const largeUnsigned = encodeCbor(cbor(1234567890123456789n));
  const negative = encodeCbor(cbor(-42));
  const shortText = encodeCbor(cbor('Hello'));
  const longText = encodeCbor(cbor('A'.repeat(1000)));
  const smallBytes = encodeCbor(cbor(new Uint8Array([1, 2, 3, 4, 5])));
  const largeBytes = encodeCbor(cbor(new Uint8Array(1000)));
  const smallArray = encodeCbor(cbor([1, 2, 3, 4, 5]));
  const largeArray = encodeCbor(
    cbor(Array.from({ length: 100 }, (_, i) => i))
  );

  const smallMap = new CborMap();
  smallMap.set('a', 1);
  smallMap.set('b', 2);
  smallMap.set('c', 3);
  const smallMapBytes = encodeCbor(cbor(smallMap));

  const largeMap = new CborMap();
  for (let i = 0; i < 100; i++) {
    largeMap.set(`key${i}`, i);
  }
  const largeMapBytes = encodeCbor(cbor(largeMap));

  const date = new CborDate();
  const dateBytes = encodeCbor(date.taggedCbor());

  const set = CborSet.fromArray([1, 2, 3, 4, 5]);
  const setBytes = encodeCbor(set.taggedCbor());

  const boolBytes = encodeCbor(cbor(true));
  const nullBytes = encodeCbor(cbor(null));
  const float32Bytes = encodeCbor(cbor(3.14159));
  const float64Bytes = encodeCbor(cbor(Math.PI));

  // Run benchmarks
  results.push(benchmark('decode unsigned (small)', () => decodeCbor(smallUnsigned), iterations));
  results.push(benchmark('decode unsigned (large)', () => decodeCbor(largeUnsigned), iterations));
  results.push(benchmark('decode negative', () => decodeCbor(negative), iterations));
  results.push(benchmark('decode text (short)', () => decodeCbor(shortText), iterations));
  results.push(benchmark('decode text (long)', () => decodeCbor(longText), iterations));
  results.push(benchmark('decode bytes (small)', () => decodeCbor(smallBytes), iterations));
  results.push(benchmark('decode bytes (large)', () => decodeCbor(largeBytes), iterations));
  results.push(benchmark('decode array (small)', () => decodeCbor(smallArray), iterations));
  results.push(benchmark('decode array (large)', () => decodeCbor(largeArray), iterations));
  results.push(benchmark('decode map (small)', () => decodeCbor(smallMapBytes), iterations));
  results.push(benchmark('decode map (large)', () => decodeCbor(largeMapBytes), iterations));
  results.push(benchmark('decode tagged (date)', () => decodeCbor(dateBytes), iterations));
  results.push(benchmark('decode tagged (set)', () => decodeCbor(setBytes), iterations));
  results.push(benchmark('decode simple (boolean)', () => decodeCbor(boolBytes), iterations));
  results.push(benchmark('decode simple (null)', () => decodeCbor(nullBytes), iterations));
  results.push(benchmark('decode float32', () => decodeCbor(float32Bytes), iterations));
  results.push(benchmark('decode float64', () => decodeCbor(float64Bytes), iterations));

  return results;
}

/**
 * Run round-trip (encode + decode) benchmarks.
 */
export function benchmarkRoundTrip(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const iterations = 5000; // Reduced for reasonable execution time

  results.push(
    benchmark('round-trip unsigned', () => {
      const encoded = encodeCbor(cbor(42));
      decodeCbor(encoded);
    }, iterations)
  );

  results.push(
    benchmark('round-trip text', () => {
      const encoded = encodeCbor(cbor('Hello'));
      decodeCbor(encoded);
    }, iterations)
  );

  results.push(
    benchmark('round-trip array', () => {
      const encoded = encodeCbor(cbor([1, 2, 3, 4, 5]));
      decodeCbor(encoded);
    }, iterations)
  );

  const map = new CborMap();
  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);

  results.push(
    benchmark('round-trip map', () => {
      const encoded = encodeCbor(cbor(map));
      decodeCbor(encoded);
    }, iterations)
  );

  results.push(
    benchmark('round-trip date', () => {
      const date = new CborDate();
      const encoded = encodeCbor(date.taggedCbor());
      decodeCbor(encoded);
    }, iterations)
  );

  return results;
}

/**
 * Run map operations benchmarks.
 */
export function benchmarkMapOperations(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const iterations = 5000; // Reduced for reasonable execution time

  // Map creation
  results.push(
    benchmark('map creation (10 items)', () => {
      const map = new CborMap();
      for (let i = 0; i < 10; i++) {
        map.set(`key${i}`, i);
      }
    }, iterations)
  );

  results.push(
    benchmark('map creation (100 items)', () => {
      const map = new CborMap();
      for (let i = 0; i < 100; i++) {
        map.set(`key${i}`, i);
      }
    }, iterations)
  );

  // Map lookup
  const lookupMap = new CborMap();
  for (let i = 0; i < 100; i++) {
    lookupMap.set(`key${i}`, i);
  }

  results.push(
    benchmark('map lookup', () => {
      lookupMap.get('key50');
    }, iterations)
  );

  results.push(
    benchmark('map has', () => {
      lookupMap.has('key50');
    }, iterations)
  );

  results.push(
    benchmark('map iteration', () => {
      for (const entry of lookupMap.entries) {
        // Process entry
        void entry;
      }
    }, iterations)
  );

  return results;
}

/**
 * Run all benchmarks and return results.
 */
export function runAllBenchmarks(): BenchmarkSuite {
  console.log('Running bc-dcbor-ts benchmarks...\n');

  const results: BenchmarkResult[] = [];

  console.log('Encoding benchmarks...');
  results.push(...benchmarkEncoding());

  console.log('Decoding benchmarks...');
  results.push(...benchmarkDecoding());

  console.log('Round-trip benchmarks...');
  results.push(...benchmarkRoundTrip());

  console.log('Map operations benchmarks...');
  results.push(...benchmarkMapOperations());

  return {
    name: 'bc-dcbor-ts benchmark suite',
    results,
    timestamp: new Date(),
  };
}

/**
 * Format benchmark results as a table.
 */
export function formatResults(suite: BenchmarkSuite): string {
  const lines: string[] = [];

  lines.push(`# ${suite.name}`);
  lines.push(`Timestamp: ${suite.timestamp.toISOString()}\n`);

  lines.push('| Benchmark | Operations | Total Time | Avg Time | Ops/Sec |');
  lines.push('|-----------|------------|------------|----------|---------|');

  for (const result of suite.results) {
    const opsStr = result.operations.toLocaleString();
    const totalStr = `${result.totalTimeMs.toFixed(2)}ms`;
    const avgStr = `${result.avgTimeUs.toFixed(2)}µs`;
    const opsPerSecStr = result.opsPerSec.toFixed(0);

    lines.push(
      `| ${result.name} | ${opsStr} | ${totalStr} | ${avgStr} | ${opsPerSecStr} |`
    );
  }

  // Summary statistics
  const totalOps = suite.results.reduce((sum, r) => sum + r.operations, 0);
  const totalTime = suite.results.reduce((sum, r) => sum + r.totalTimeMs, 0);
  const avgOpsPerSec =
    suite.results.reduce((sum, r) => sum + r.opsPerSec, 0) / suite.results.length;

  lines.push('\n## Summary');
  lines.push(`- Total operations: ${totalOps.toLocaleString()}`);
  lines.push(`- Total time: ${totalTime.toFixed(2)}ms`);
  lines.push(`- Average ops/sec: ${avgOpsPerSec.toFixed(0)}`);
  lines.push(`- Benchmark count: ${suite.results.length}`);

  return lines.join('\n');
}

/**
 * Print benchmark results to console.
 */
export function printResults(suite: BenchmarkSuite): void {
  console.log('\n' + formatResults(suite));
}
