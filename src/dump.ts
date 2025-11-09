/**
 * Hex dump utilities for CBOR data.
 *
 * This file exists for 1:1 correspondence with Rust's dump.rs.
 *
 * @module dump
 */

import { bytesToHex } from './data-utils';

/**
 * Create a hex dump of binary data with optional annotations.
 *
 * @param data - Binary data to dump
 * @param annotation - Optional annotation string
 * @returns Hex string representation
 */
export function hexDump(data: Uint8Array, annotation?: string): string {
  const hex = bytesToHex(data);
  if (annotation) {
    return `${hex}  # ${annotation}`;
  }
  return hex;
}

/**
 * Create a formatted hex dump with line breaks and indentation.
 *
 * @param data - Binary data to dump
 * @param bytesPerLine - Number of bytes per line (default: 16)
 * @param indent - Indentation string (default: empty)
 * @returns Formatted hex dump string
 */
export function hexDumpFormatted(
  data: Uint8Array,
  bytesPerLine: number = 16,
  indent: string = ''
): string {
  const lines: string[] = [];
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, Math.min(i + bytesPerLine, data.length));
    const hex = bytesToHex(chunk);
    lines.push(`${indent}${hex}`);
  }
  return lines.join('\n');
}
