// src/utils/__tests__/formatting.test.ts

import { describe, it, expect } from 'vitest';
import {
  parseTeamCityTimestamp,
  formatDateForDiscord,
  formatTeamCityTimestamp,
  formatElapsedTime,
  formatEstimatedCompletion,
  calculateDuration
} from '../formatting.js';

describe('parseTeamCityTimestamp', () => {
  it('should parse valid TeamCity timestamp', () => {
    const result = parseTeamCityTimestamp('20250812T000012-0300');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(7); // 0-indexed, so August = 7
    expect(result?.getDate()).toBe(12);
  });

  it('should parse timestamp with positive timezone', () => {
    const result = parseTeamCityTimestamp('20250812T120000+0500');
    expect(result).toBeInstanceOf(Date);
    // The hour will be different due to timezone conversion, just check it's a valid date
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(7); // August = 7 (0-indexed)
    expect(result?.getDate()).toBe(12);
  });

  it('should return null for invalid format', () => {
    expect(parseTeamCityTimestamp('invalid')).toBeNull();
    expect(parseTeamCityTimestamp('2025-08-12T00:00:12')).toBeNull();
    expect(parseTeamCityTimestamp('')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(parseTeamCityTimestamp(null as any)).toBeNull();
    expect(parseTeamCityTimestamp(undefined as any)).toBeNull();
    expect(parseTeamCityTimestamp(123 as any)).toBeNull();
  });

  it('should handle edge cases in date values', () => {
    // Test leap year
    const leapYear = parseTeamCityTimestamp('20240229T120000+0000');
    expect(leapYear).toBeInstanceOf(Date);
    
    // Test invalid date (should return null)
    const invalidDate = parseTeamCityTimestamp('20250230T120000+0000'); // Feb 30th doesn't exist
    expect(invalidDate).toBeNull();
    
    // Test invalid month
    const invalidMonth = parseTeamCityTimestamp('20250013T120000+0000'); // Month 13 doesn't exist
    expect(invalidMonth).toBeNull();
  });
});

describe('formatDateForDiscord', () => {
  it('should format date in readable format', () => {
    const date = new Date('2025-08-12T12:30:45Z');
    const result = formatDateForDiscord(date);
    expect(result).toContain('Aug');
    expect(result).toContain('12');
    expect(result).toContain('2025');
  });

  it('should handle different dates consistently', () => {
    const date1 = new Date('2025-01-01T12:00:00Z');
    const date2 = new Date('2025-12-31T12:00:00Z');
    
    const result1 = formatDateForDiscord(date1);
    const result2 = formatDateForDiscord(date2);
    
    expect(result1).toContain('Jan');
    expect(result1).toContain('2025');
    expect(result2).toContain('Dec');
    expect(result2).toContain('2025');
  });
});

describe('formatTeamCityTimestamp', () => {
  it('should format valid timestamp', () => {
    const result = formatTeamCityTimestamp('20250812T120000-0300');
    expect(result).not.toBe('Invalid date');
    expect(result).toContain('Aug');
    expect(result).toContain('2025');
  });

  it('should return "Invalid date" for invalid timestamp', () => {
    expect(formatTeamCityTimestamp('invalid')).toBe('Invalid date');
    expect(formatTeamCityTimestamp('')).toBe('Invalid date');
  });
});

describe('formatElapsedTime', () => {
  it('should format seconds only', () => {
    expect(formatElapsedTime(30)).toBe('30s');
    expect(formatElapsedTime(0)).toBe('0s');
  });

  it('should format minutes and seconds', () => {
    expect(formatElapsedTime(90)).toBe('1m 30s');
    expect(formatElapsedTime(120)).toBe('2m');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatElapsedTime(3661)).toBe('1h 1m 1s');
    expect(formatElapsedTime(3600)).toBe('1h');
    expect(formatElapsedTime(7200)).toBe('2h');
  });

  it('should handle large durations', () => {
    expect(formatElapsedTime(90061)).toBe('25h 1m 1s');
  });

  it('should handle negative values', () => {
    expect(formatElapsedTime(-10)).toBe('0s');
  });

  it('should handle edge cases', () => {
    expect(formatElapsedTime(59)).toBe('59s');
    expect(formatElapsedTime(60)).toBe('1m');
    expect(formatElapsedTime(61)).toBe('1m 1s');
  });
});

describe('formatEstimatedCompletion', () => {
  it('should calculate remaining time correctly', () => {
    expect(formatEstimatedCompletion(30, 90)).toBe('1m');
    expect(formatEstimatedCompletion(0, 3600)).toBe('1h');
  });

  it('should handle completion scenarios', () => {
    expect(formatEstimatedCompletion(100, 100)).toBe('Completing...');
    expect(formatEstimatedCompletion(150, 100)).toBe('Completing...');
  });

  it('should handle invalid inputs', () => {
    expect(formatEstimatedCompletion(50, 0)).toBe('Unknown');
    expect(formatEstimatedCompletion(50, -10)).toBe('Unknown');
    expect(formatEstimatedCompletion(-10, 100)).toBe('Unknown');
  });

  it('should handle edge cases', () => {
    expect(formatEstimatedCompletion(99, 100)).toBe('1s');
    expect(formatEstimatedCompletion(0, 1)).toBe('1s');
  });
});

describe('calculateDuration', () => {
  it('should calculate duration between valid timestamps', () => {
    const start = '20250812T120000-0300';
    const end = '20250812T120130-0300'; // 1 minute 30 seconds later
    
    const result = calculateDuration(start, end);
    expect(result).toBe('1m 30s');
  });

  it('should handle same timestamps', () => {
    const timestamp = '20250812T120000-0300';
    const result = calculateDuration(timestamp, timestamp);
    expect(result).toBe('0s');
  });

  it('should return null for invalid timestamps', () => {
    expect(calculateDuration('invalid', '20250812T120000-0300')).toBeNull();
    expect(calculateDuration('20250812T120000-0300', 'invalid')).toBeNull();
    expect(calculateDuration('invalid', 'invalid')).toBeNull();
  });

  it('should handle longer durations', () => {
    const start = '20250812T120000-0300';
    const end = '20250812T133130-0300'; // 1h 31m 30s later
    
    const result = calculateDuration(start, end);
    expect(result).toBe('1h 31m 30s');
  });

  it('should handle reverse order (end before start)', () => {
    const start = '20250812T120000-0300';
    const end = '20250812T115900-0300'; // 1 minute before
    
    const result = calculateDuration(start, end);
    // Should still work but return negative duration as 0s
    expect(result).toBe('0s');
  });
});