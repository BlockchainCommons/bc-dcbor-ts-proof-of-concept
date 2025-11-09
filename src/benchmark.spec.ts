/**
 * Tests for benchmark suite.
 */

import { describe, test, expect } from '@jest/globals';
import {
  benchmark,
  benchmarkEncoding,
  benchmarkDecoding,
  benchmarkRoundTrip,
  benchmarkMapOperations,
  runAllBenchmarks,
  formatResults,
} from './benchmark';

describe('Benchmark Suite', () => {
  test('benchmark runs function and returns result', () => {
    let counter = 0;
    const result = benchmark(
      'test',
      () => {
        counter++;
      },
      100
    );

    expect(result.name).toBe('test');
    expect(result.operations).toBe(100);
    expect(result.totalTimeMs).toBeGreaterThan(0);
    expect(result.avgTimeUs).toBeGreaterThan(0);
    expect(result.opsPerSec).toBeGreaterThan(0);
    expect(counter).toBeGreaterThanOrEqual(100); // Including warm-up
  });

  test('benchmarkEncoding returns results', () => {
    const results = benchmarkEncoding();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('encode');
    expect(results[0].operations).toBeGreaterThan(0);
  });

  test('benchmarkDecoding returns results', () => {
    const results = benchmarkDecoding();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('decode');
    expect(results[0].operations).toBeGreaterThan(0);
  });

  test('benchmarkRoundTrip returns results', () => {
    const results = benchmarkRoundTrip();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('round-trip');
    expect(results[0].operations).toBeGreaterThan(0);
  });

  test('benchmarkMapOperations returns results', () => {
    const results = benchmarkMapOperations();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('map');
    expect(results[0].operations).toBeGreaterThan(0);
  });

  test('runAllBenchmarks returns complete suite', () => {
    const suite = runAllBenchmarks();
    expect(suite.name).toBe('bc-dcbor-ts benchmark suite');
    expect(suite.results.length).toBeGreaterThan(0);
    expect(suite.timestamp).toBeInstanceOf(Date);
  });

  test('formatResults returns formatted string', () => {
    const suite = runAllBenchmarks();
    const formatted = formatResults(suite);
    expect(formatted).toContain('bc-dcbor-ts benchmark suite');
    expect(formatted).toContain('Timestamp:');
    expect(formatted).toContain('| Benchmark |');
    expect(formatted).toContain('## Summary');
  });

  test('benchmark results have consistent performance', () => {
    // Run same benchmark twice
    const result1 = benchmark('consistent', () => {
      const x = 1 + 1;
      void x;
    }, 1000);

    const result2 = benchmark('consistent', () => {
      const x = 1 + 1;
      void x;
    }, 1000);

    // Performance should be within 2x (allowing for variance)
    const ratio = result1.opsPerSec / result2.opsPerSec;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2.0);
  });
});
