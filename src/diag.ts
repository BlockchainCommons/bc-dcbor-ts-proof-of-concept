/**
 * Enhanced diagnostic formatting for CBOR values.
 *
 * Provides multiple formatting options including:
 * - Annotated diagnostics with tag names
 * - Summarized values using custom summarizers
 * - Flat (single-line) vs pretty (multi-line) formatting
 * - Configurable tag store usage
 *
 * @module diag
 */

import { Cbor, MajorType } from './cbor';
import { isSimpleFloat } from './simple';
import { bytesToHex } from './data-utils';
import { TagsStore, getGlobalTagsStore } from './tags-store';
import { Tag } from './tag';
import type { WalkElement } from './walk';

/**
 * Options for diagnostic formatting.
 */
export interface DiagFormatOpts {
  /**
   * Add tag names as annotations.
   * When true, tagged values are displayed as "tagName(content)" instead of "tagValue(content)".
   *
   * @default false
   */
  annotate?: boolean;

  /**
   * Use custom summarizers for tagged values.
   * When true, calls registered summarizers for tagged values.
   *
   * @default false
   */
  summarize?: boolean;

  /**
   * Single-line (flat) output.
   * When true, arrays and maps are formatted without line breaks.
   *
   * @default false
   */
  flat?: boolean;

  /**
   * Tag store to use for tag name resolution.
   * - TagsStore instance: Use specific store
   * - 'global': Use global singleton store
   * - 'none': Don't use any store (just show tag numbers)
   *
   * @default 'global'
   */
  tags?: TagsStore | 'global' | 'none';

  /**
   * Current indentation level (internal use for recursion).
   * @internal
   */
  indent?: number;

  /**
   * Indentation string (spaces per level).
   * @internal
   */
  indentString?: string;
}

/**
 * Default formatting options.
 */
const DEFAULT_OPTS: DiagFormatOpts = {
  annotate: false,
  summarize: false,
  flat: false,
  tags: 'global',
  indent: 0,
  indentString: '  '
};

/**
 * Format CBOR value as diagnostic notation with options.
 *
 * @param cbor - CBOR value to format
 * @param opts - Formatting options
 * @returns Diagnostic string
 *
 * @example
 * ```typescript
 * const value = cbor({ name: 'Alice', age: 30 });
 * console.log(diagnosticOpt(value, { flat: true }));
 * // {\"name\": \"Alice\", \"age\": 30}
 *
 * const tagged = createTaggedCbor({ ... });
 * console.log(diagnosticOpt(tagged, { annotate: true }));
 * // date(1234567890)
 * ```
 */
export function diagnosticOpt(cbor: Cbor, opts?: DiagFormatOpts): string {
  const options = { ...DEFAULT_OPTS, ...opts };
  return formatDiagnostic(cbor, options);
}

/**
 * Format CBOR value as standard diagnostic notation.
 *
 * @param cbor - CBOR value to format
 * @returns Diagnostic string
 *
 * @example
 * ```typescript
 * const value = cbor([1, 2, 3]);
 * console.log(diagnostic(value)); // "[1, 2, 3]"
 * ```
 */
export function diagnostic(cbor: Cbor): string {
  return diagnosticOpt(cbor);
}

/**
 * Format CBOR value with tag name annotations.
 *
 * Tagged values are displayed with their registered names instead of numeric tags.
 *
 * @param cbor - CBOR value to format
 * @returns Annotated diagnostic string
 *
 * @example
 * ```typescript
 * const date = CborDate.now().taggedCbor();
 * console.log(diagnosticAnnotated(date));
 * // date(1234567890) instead of 1(1234567890)
 * ```
 */
export function diagnosticAnnotated(cbor: Cbor): string {
  return diagnosticOpt(cbor, { annotate: true });
}

/**
 * Format CBOR value as flat (single-line) diagnostic notation.
 *
 * Arrays and maps are formatted without line breaks.
 *
 * @param cbor - CBOR value to format
 * @returns Flat diagnostic string
 *
 * @example
 * ```typescript
 * const nested = cbor([[1, 2], [3, 4]]);
 * console.log(diagnosticFlat(nested));
 * // "[[1, 2], [3, 4]]"
 * ```
 */
export function diagnosticFlat(cbor: Cbor): string;
export function diagnosticFlat(element: WalkElement): string;
export function diagnosticFlat(input: Cbor | WalkElement): string {
  // Check if it's a WalkElement by checking for 'type' property
  if (typeof input === 'object' && input !== null && 'type' in input &&
      (input.type === 'single' || input.type === 'keyvalue')) {
    const element = input as WalkElement;
    if (element.type === 'single') {
      return diagnosticOpt(element.cbor, { flat: true });
    } else {
      return `${diagnosticOpt(element.key, { flat: true })}: ${diagnosticOpt(element.value, { flat: true })}`;
    }
  }
  // Otherwise treat as Cbor
  return diagnosticOpt(input as Cbor, { flat: true });
}

/**
 * Format CBOR value using custom summarizers for tagged values.
 *
 * If a summarizer is registered for a tagged value, uses that instead of
 * showing the full content.
 *
 * @param cbor - CBOR value to format
 * @returns Summarized diagnostic string
 *
 * @example
 * ```typescript
 * // If a summarizer is registered for tag 123:
 * const tagged = cbor({ type: MajorType.Tagged, tag: 123, value: ... });
 * console.log(summary(tagged));
 * // "custom-summary" (instead of full content)
 * ```
 */
export function summary(cbor: Cbor): string {
  return diagnosticOpt(cbor, { summarize: true, flat: true });
}

/**
 * Internal recursive formatter.
 *
 * @internal
 */
function formatDiagnostic(cbor: Cbor, opts: DiagFormatOpts): string {
  switch (cbor.type) {
    case MajorType.Unsigned:
      return formatUnsigned(cbor.value);

    case MajorType.Negative:
      return formatNegative(cbor.value);

    case MajorType.ByteString:
      return formatBytes(cbor.value);

    case MajorType.Text:
      return formatText(cbor.value);

    case MajorType.Array:
      return formatArray(cbor.value, opts);

    case MajorType.Map:
      return formatMap(cbor.value, opts);

    case MajorType.Tagged:
      return formatTagged(cbor.tag, cbor.value, opts);

    case MajorType.Simple:
      return formatSimple(cbor.value);
  }
}

/**
 * Format unsigned integer.
 */
function formatUnsigned(value: number | bigint): string {
  return String(value);
}

/**
 * Format negative integer.
 */
function formatNegative(value: number | bigint): string {
  // Value is stored as magnitude, convert to actual negative value for display
  if (typeof value === 'bigint') {
    return String(-value - 1n);
  } else {
    return String(-value - 1);
  }
}

/**
 * Format byte string.
 */
function formatBytes(value: Uint8Array): string {
  return `h'${bytesToHex(value)}'`;
}

/**
 * Format text string.
 */
function formatText(value: string): string {
  // Escape special characters
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/**
 * Format array.
 */
function formatArray(items: Cbor[], opts: DiagFormatOpts): string {
  if (items.length === 0) {
    return '[]';
  }

  if (opts.flat) {
    // Single-line formatting
    const formatted = items.map(item => formatDiagnostic(item, opts));
    return `[${formatted.join(', ')}]`;
  } else {
    // Multi-line formatting
    const indent = opts.indent || 0;
    const indentStr = (opts.indentString || '  ').repeat(indent);
    const itemIndentStr = (opts.indentString || '  ').repeat(indent + 1);

    const formatted = items.map(item => {
      const childOpts = { ...opts, indent: indent + 1 };
      const itemStr = formatDiagnostic(item, childOpts);
      return `${itemIndentStr}${itemStr}`;
    });

    return `[\n${formatted.join(',\n')}\n${indentStr}]`;
  }
}

/**
 * Format map.
 */
function formatMap(map: any, opts: DiagFormatOpts): string {
  // Get diagnostic representation from map
  if (map && typeof map === 'object' && 'diagnostic' in map) {
    return map.diagnostic;
  }

  // Fallback for plain objects
  return '{}';
}

/**
 * Format tagged value.
 */
function formatTagged(tag: number | bigint, content: Cbor, opts: DiagFormatOpts): string {
  // Check for summarizer first
  if (opts.summarize) {
    const store = resolveTagsStore(opts.tags);
    if (store) {
      const summarizer = store.summarizer(tag);
      if (summarizer) {
        const summarized = summarizer(content, opts.flat || false);
        return summarized;
      }
    }
  }

  // Get tag name if annotation is enabled
  let tagStr: string;
  if (opts.annotate) {
    const store = resolveTagsStore(opts.tags);
    if (store) {
      tagStr = store.nameForValue(tag);
    } else {
      tagStr = String(tag);
    }
  } else {
    tagStr = String(tag);
  }

  // Format content
  const contentStr = formatDiagnostic(content, opts);

  return `${tagStr}(${contentStr})`;
}

/**
 * Format simple value.
 */
function formatSimple(value: any): string {
  // CBOR simple values: false=0x14 (20), true=0x15 (21), null=0x16 (22)
  if (value === 0x15 || value === 21) {
    return 'true';
  } else if (value === 0x14 || value === 20) {
    return 'false';
  } else if (value === 0x16 || value === 22) {
    return 'null';
  } else if (value === undefined) {
    return 'undefined';
  } else if (isSimpleFloat(value)) {
    return formatFloat(value.float);
  } else {
    return `simple(${value})`;
  }
}

/**
 * Format float value.
 */
function formatFloat(value: number): string {
  if (isNaN(value)) {
    return 'NaN';
  } else if (!isFinite(value)) {
    return value > 0 ? 'Infinity' : '-Infinity';
  } else {
    // Show decimal point for clarity
    const str = String(value);
    return str.includes('.') ? str : `${str}.0`;
  }
}

/**
 * Resolve tags store from option.
 */
function resolveTagsStore(tags?: TagsStore | 'global' | 'none'): TagsStore | undefined {
  if (tags === 'none') {
    return undefined;
  } else if (tags === 'global' || tags === undefined) {
    return getGlobalTagsStore();
  } else {
    return tags;
  }
}

// ============================================================================
// Convenience Formatting Functions
// ============================================================================

/**
 * Format CBOR value with pretty multi-line formatting.
 *
 * @param cbor - CBOR value to format
 * @param annotate - Whether to annotate tags with names
 * @returns Pretty formatted string
 *
 * @example
 * ```typescript
 * const nested = cbor({ users: [{ name: 'Alice' }, { name: 'Bob' }] });
 * console.log(prettyDiagnostic(nested));
 * // {
 * //   "users": [
 * //     {"name": "Alice"},
 * //     {"name": "Bob"}
 * //   ]
 * // }
 * ```
 */
export function prettyDiagnostic(cbor: Cbor, annotate = false): string {
  return diagnosticOpt(cbor, { flat: false, annotate });
}

/**
 * Format CBOR value with all options enabled.
 *
 * Useful for debugging: annotated, pretty formatted.
 *
 * @param cbor - CBOR value to format
 * @returns Fully annotated diagnostic string
 *
 * @example
 * ```typescript
 * const value = CborDate.now().taggedCbor();
 * console.log(fullDiagnostic(value));
 * // date(1234567890)
 * ```
 */
export function fullDiagnostic(cbor: Cbor): string {
  return diagnosticOpt(cbor, {
    annotate: true,
    summarize: false,
    flat: false
  });
}

/**
 * Format CBOR value with tag names and summarizers.
 *
 * Most compact representation while still being informative.
 *
 * @param cbor - CBOR value to format
 * @returns Compact diagnostic string
 *
 * @example
 * ```typescript
 * const value = CborDate.now().taggedCbor();
 * console.log(compactDiagnostic(value));
 * // date(1234567890) or custom summary
 * ```
 */
export function compactDiagnostic(cbor: Cbor): string {
  return diagnosticOpt(cbor, {
    annotate: true,
    summarize: true,
    flat: true
  });
}
