/**
 * Date/time support for CBOR with tag(1) encoding.
 *
 * Represents dates as epoch-based timestamps (seconds since 1970-01-01T00:00:00Z).
 * Supports fractional seconds for precise timestamps.
 *
 * @module date
 */

import { Cbor, MajorType } from './cbor';
import { cbor } from './encode';
import { extractCbor } from './extract';
import { createTag } from './tag';
import { TAG_EPOCH_DATE_TIME } from './tags';
import {
  CBORTaggedEncodable,
  CBORTaggedDecodable,
  createTaggedCbor,
  validateTag,
  extractTaggedContent
} from './cbor-tagged';

/**
 * CBOR Date type with tag(1) encoding.
 *
 * Encodes dates as numeric timestamps (seconds since epoch).
 * Automatically uses integers for whole seconds, floats for fractional seconds.
 *
 * @example
 * ```typescript
 * // Create date
 * const now = CborDate.now();
 * const date = CborDate.fromYMD(2022, 3, 21);
 * const timestamp = CborDate.fromTimestamp(1647885871);
 *
 * // Encode to CBOR
 * const tagged = date.taggedCbor();
 *
 * // Decode from CBOR
 * const decoded = CborDate.fromTaggedCbor(tagged);
 * ```
 */
export class CborDate implements CBORTaggedEncodable, CBORTaggedDecodable<CborDate> {
  private date: Date;

  /**
   * Create a CborDate.
   *
   * @param date - JavaScript Date object (defaults to current time)
   */
  constructor(date: Date = new Date()) {
    this.date = date;
  }

  // =========================================================================
  // Factory Methods
  // =========================================================================

  /**
   * Create CborDate from Unix timestamp (seconds since epoch).
   *
   * @param secondsSinceEpoch - Seconds since 1970-01-01T00:00:00Z
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromTimestamp(1647885871);
   * const withFraction = CborDate.fromTimestamp(1647885871.5);
   * ```
   */
  static fromTimestamp(secondsSinceEpoch: number): CborDate {
    const ms = secondsSinceEpoch * 1000;
    return new CborDate(new Date(ms));
  }

  /**
   * Create CborDate from year, month, day.
   *
   * @param year - Full year (e.g., 2022)
   * @param month - Month (1-12)
   * @param day - Day of month (1-31)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMD(2022, 3, 21); // March 21, 2022
   * ```
   */
  static fromYMD(year: number, month: number, day: number): CborDate {
    return new CborDate(new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)));
  }

  /**
   * Create CborDate from year, month, day, hour, minute, second.
   *
   * @param year - Full year
   * @param month - Month (1-12)
   * @param day - Day of month (1-31)
   * @param hour - Hour (0-23)
   * @param minute - Minute (0-59)
   * @param second - Second (0-59)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMDHMS(2022, 3, 21, 18, 24, 31);
   * ```
   */
  static fromYMDHMS(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number
  ): CborDate {
    return new CborDate(
      new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0))
    );
  }

  /**
   * Create CborDate from ISO 8601 date string.
   *
   * @param dateStr - ISO 8601 date string
   * @returns New CborDate instance
   * @throws Error if string is not a valid date
   *
   * @example
   * ```typescript
   * const date = CborDate.fromString('2022-03-21T18:24:31Z');
   * const date2 = CborDate.fromString('2022-03-21');
   * ```
   */
  static fromString(dateStr: string): CborDate {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateStr}`);
    }
    return new CborDate(date);
  }

  /**
   * Create CborDate representing current time.
   *
   * @returns New CborDate instance with current time
   *
   * @example
   * ```typescript
   * const now = CborDate.now();
   * ```
   */
  static now(): CborDate {
    return new CborDate(new Date());
  }

  /**
   * Create CborDate with duration from now.
   *
   * @param milliseconds - Milliseconds to add to current time (can be negative)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const tomorrow = CborDate.withDurationFromNow(24 * 60 * 60 * 1000);
   * const yesterday = CborDate.withDurationFromNow(-24 * 60 * 60 * 1000);
   * ```
   */
  static withDurationFromNow(milliseconds: number): CborDate {
    return new CborDate(new Date(Date.now() + milliseconds));
  }

  // =========================================================================
  // Getters
  // =========================================================================

  /**
   * Get the underlying JavaScript Date object.
   *
   * @returns The Date object
   */
  getDate(): Date {
    return this.date;
  }

  /**
   * Get the Unix timestamp (seconds since epoch).
   *
   * @returns Seconds since 1970-01-01T00:00:00Z (may include fractional part)
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMD(2022, 3, 21);
   * console.log(date.timestamp()); // 1647820800
   * ```
   */
  timestamp(): number {
    return this.date.getTime() / 1000;
  }

  // =========================================================================
  // CBORTagged Implementation
  // =========================================================================

  cborTags() {
    return [createTag(TAG_EPOCH_DATE_TIME, 'date')];
  }

  untaggedCbor(): Cbor {
    const timestamp = this.timestamp();
    // The cbor() function automatically handles:
    // - Whole numbers as integers (unsigned or negative)
    // - Fractional numbers as floats
    return cbor(timestamp);
  }

  taggedCbor(): Cbor {
    return createTaggedCbor(this);
  }

  fromUntaggedCbor(c: Cbor): CborDate {
    let timestamp: number;

    switch (c.type) {
      case MajorType.Unsigned:
        timestamp = typeof c.value === 'number' ? c.value : Number(c.value);
        break;

      case MajorType.Negative:
        // Convert stored magnitude back to actual negative value
        if (typeof c.value === 'bigint') {
          timestamp = Number(-c.value - 1n);
        } else {
          timestamp = -c.value - 1;
        }
        break;

      case MajorType.Simple:
        if (typeof c.value === 'object' && 'float' in c.value) {
          timestamp = c.value.float;
        } else {
          throw new Error('Invalid date CBOR: expected numeric value');
        }
        break;

      default:
        throw new Error('Invalid date CBOR: expected numeric value');
    }

    this.date = new Date(timestamp * 1000);
    return this;
  }

  fromTaggedCbor(c: Cbor): CborDate {
    const expectedTags = this.cborTags();
    validateTag(c, expectedTags);
    const content = extractTaggedContent(c);
    return this.fromUntaggedCbor(content);
  }

  /**
   * Decode a CborDate from tagged CBOR (static method).
   *
   * @param cbor - Tagged CBOR value with tag(1)
   * @returns Decoded CborDate instance
   *
   * @example
   * ```typescript
   * const decoded = CborDate.fromTaggedCbor(cborValue);
   * ```
   */
  static fromTaggedCborStatic(cbor: Cbor): CborDate {
    return new CborDate().fromTaggedCbor(cbor);
  }

  // =========================================================================
  // Arithmetic Operations
  // =========================================================================

  /**
   * Add seconds to this date.
   *
   * @param seconds - Seconds to add (can be fractional)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMD(2022, 3, 21);
   * const tomorrow = date.add(24 * 60 * 60);
   * ```
   */
  add(seconds: number): CborDate {
    return CborDate.fromTimestamp(this.timestamp() + seconds);
  }

  /**
   * Subtract seconds from this date.
   *
   * @param seconds - Seconds to subtract (can be fractional)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMD(2022, 3, 21);
   * const yesterday = date.subtract(24 * 60 * 60);
   * ```
   */
  subtract(seconds: number): CborDate {
    return CborDate.fromTimestamp(this.timestamp() - seconds);
  }

  /**
   * Get the difference in seconds between this date and another.
   *
   * @param other - Other CborDate to compare with
   * @returns Difference in seconds (this - other)
   *
   * @example
   * ```typescript
   * const date1 = CborDate.fromYMD(2022, 3, 22);
   * const date2 = CborDate.fromYMD(2022, 3, 21);
   * const diff = date1.difference(date2);
   * console.log(diff); // 86400 (one day in seconds)
   * ```
   */
  difference(other: CborDate): number {
    return this.timestamp() - other.timestamp();
  }

  // =========================================================================
  // Display
  // =========================================================================

  /**
   * Convert to ISO 8601 string.
   *
   * If time is exactly midnight UTC, returns only the date portion.
   * Otherwise returns full ISO datetime.
   *
   * @returns ISO 8601 string representation
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYMD(2022, 3, 21);
   * console.log(date.toString()); // "2022-03-21"
   *
   * const datetime = CborDate.fromYMDHMS(2022, 3, 21, 18, 24, 31);
   * console.log(datetime.toString()); // "2022-03-21T18:24:31.000Z"
   * ```
   */
  toString(): string {
    const time = this.date.getUTCHours() +
                 this.date.getUTCMinutes() +
                 this.date.getUTCSeconds() +
                 this.date.getUTCMilliseconds();

    if (time === 0) {
      // Midnight - show only date
      return this.date.toISOString().split('T')[0];
    } else {
      // Show full ISO datetime
      return this.date.toISOString();
    }
  }

  /**
   * Convert to JSON (returns ISO 8601 string).
   *
   * @returns ISO 8601 string
   */
  toJSON(): string {
    return this.toString();
  }

  /**
   * Compare two dates for equality.
   *
   * @param other - Other CborDate to compare
   * @returns true if dates represent the same moment in time
   */
  equals(other: CborDate): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  /**
   * Compare two dates.
   *
   * @param other - Other CborDate to compare
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  compare(other: CborDate): number {
    const thisTime = this.date.getTime();
    const otherTime = other.date.getTime();
    if (thisTime < otherTime) return -1;
    if (thisTime > otherTime) return 1;
    return 0;
  }
}
