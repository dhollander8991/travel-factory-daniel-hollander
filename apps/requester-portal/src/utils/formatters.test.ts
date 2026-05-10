/**
 * Tests for pure formatter utilities — no mocking required.
 * getStatusSeverity maps RequestStatus values to PrimeVue severity strings.
 * formatDate converts ISO date strings to locale-formatted output.
 * getDayCount counts inclusive calendar days between two dates.
 */

import { describe, it, expect } from 'vitest';
import { getStatusSeverity, formatDate, getDayCount } from './formatters';
import { RequestStatus } from '@org/shared';

describe('getStatusSeverity', () => {
  it('returns "warn" for Pending', () => {
    expect(getStatusSeverity(RequestStatus.PENDING)).toBe('warn');
  });

  it('returns "success" for Approved', () => {
    expect(getStatusSeverity(RequestStatus.APPROVED)).toBe('success');
  });

  it('returns "danger" for Rejected', () => {
    expect(getStatusSeverity(RequestStatus.REJECTED)).toBe('danger');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD string into a human-readable date', () => {
    const result = formatDate('2025-08-15');
    // The output is locale-specific but must include the month name, day, and year
    expect(result).toMatch(/Aug/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it('handles the first day of the year without off-by-one errors', () => {
    const result = formatDate('2025-01-01');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/2025/);
  });
});

describe('getDayCount', () => {
  it('returns 1 when start and end dates are the same day', () => {
    expect(getDayCount('2025-08-15', '2025-08-15')).toBe(1);
  });

  it('returns the correct inclusive count for a multi-day range', () => {
    // Aug 1 through Aug 5 = 5 days (both endpoints included)
    expect(getDayCount('2025-08-01', '2025-08-05')).toBe(5);
  });

  it('handles a range spanning two months', () => {
    // Jan 30 to Feb 2 = 4 days
    expect(getDayCount('2025-01-30', '2025-02-02')).toBe(4);
  });

  it('handles a range spanning a full week', () => {
    expect(getDayCount('2025-08-04', '2025-08-10')).toBe(7);
  });
});
