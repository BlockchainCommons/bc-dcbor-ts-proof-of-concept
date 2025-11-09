#!/usr/bin/env ts-node

/**
 * Script to run performance benchmarks and output results.
 */

import { runAllBenchmarks, printResults, formatResults } from '../src/benchmark';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('bc-dcbor-ts Performance Benchmarks');
  console.log('==================================\n');

  const suite = runAllBenchmarks();
  printResults(suite);

  // Save results to file
  const resultsDir = path.join(__dirname, '..', 'benchmark-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `benchmark-${timestamp}.md`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, formatResults(suite));
  console.log(`\nResults saved to: ${filepath}`);

  // Also save latest results
  const latestPath = path.join(resultsDir, 'latest.md');
  fs.writeFileSync(latestPath, formatResults(suite));
  console.log(`Latest results: ${latestPath}`);
}

main();
