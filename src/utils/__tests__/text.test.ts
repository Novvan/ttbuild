// src/utils/__tests__/text.test.ts

import { describe, it, expect } from 'vitest';
import {
  DISCORD_LIMITS,
  truncateText,
  sanitizeForDiscord,
  formatEmbedTitle,
  formatEmbedDescription,
  formatEmbedFieldName,
  formatEmbedFieldValue,
  formatEmbedFooter,
  formatUrl,
  makeSafeForDiscord
} from '../text.js';

describe('DISCORD_LIMITS', () => {
  it('should have correct limit values', () => {
    expect(DISCORD_LIMITS.TITLE).toBe(256);
    expect(DISCORD_LIMITS.DESCRIPTION).toBe(4096);
    expect(DISCORD_LIMITS.FIELD_NAME).toBe(256);
    expect(DISCORD_LIMITS.FIELD_VALUE).toBe(1024);
    expect(DISCORD_LIMITS.FOOTER_TEXT).toBe(2048);
    expect(DISCORD_LIMITS.AUTHOR_NAME).toBe(256);
    expect(DISCORD_LIMITS.TOTAL_CHARACTERS).toBe(6000);
  });
});

describe('truncateText', () => {
  it('should not truncate text shorter than limit', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
    expect(truncateText('Test', 4)).toBe('Test');
  });

  it('should truncate text longer than limit', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...');
    expect(truncateText('This is a long text', 10)).toBe('This is...');
  });

  it('should use custom suffix', () => {
    expect(truncateText('Hello World', 8, ' [more]')).toBe('H [more]');
    expect(truncateText('Test', 10, ' (truncated)')).toBe('Test');
  });

  it('should handle edge cases', () => {
    expect(truncateText('', 10)).toBe('');
    expect(truncateText('Test', 0)).toBe('...');
    expect(truncateText('Test', 3)).toBe('...');
  });

  it('should handle invalid inputs', () => {
    expect(truncateText(null as any, 10)).toBe('');
    expect(truncateText(undefined as any, 10)).toBe('');
    expect(truncateText(123 as any, 10)).toBe('');
  });
});

describe('sanitizeForDiscord', () => {
  it('should remove control characters', () => {
    const input = 'Hello\x00World\x1F';
    expect(sanitizeForDiscord(input)).toBe('Hello World');
  });

  it('should preserve newlines and tabs', () => {
    const input = 'Hello\nWorld\tTest';
    expect(sanitizeForDiscord(input)).toBe('Hello World Test'); // Multiple whitespace becomes single space
  });

  it('should replace multiple whitespace with single space', () => {
    expect(sanitizeForDiscord('Hello    World')).toBe('Hello World');
    expect(sanitizeForDiscord('Test\n\n\nLine')).toBe('Test Line');
  });

  it('should trim whitespace', () => {
    expect(sanitizeForDiscord('  Hello World  ')).toBe('Hello World');
    expect(sanitizeForDiscord('\t\nTest\t\n')).toBe('Test');
  });

  it('should handle invalid inputs', () => {
    expect(sanitizeForDiscord(null as any)).toBe('');
    expect(sanitizeForDiscord(undefined as any)).toBe('');
    expect(sanitizeForDiscord(123 as any)).toBe('');
  });
});

describe('formatEmbedTitle', () => {
  it('should format normal title', () => {
    const title = 'Build Started: TelltaleTool';
    expect(formatEmbedTitle(title)).toBe(title);
  });

  it('should truncate long titles', () => {
    const longTitle = 'A'.repeat(300);
    const result = formatEmbedTitle(longTitle);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.TITLE);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should sanitize and truncate', () => {
    const dirtyTitle = 'Build\x00Started:    ' + 'A'.repeat(300);
    const result = formatEmbedTitle(dirtyTitle);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.TITLE);
    expect(result.startsWith('Build Started:')).toBe(true);
  });
});

describe('formatEmbedDescription', () => {
  it('should format normal description', () => {
    const desc = 'Build completed successfully';
    expect(formatEmbedDescription(desc)).toBe(desc);
  });

  it('should truncate very long descriptions', () => {
    const longDesc = 'A'.repeat(5000);
    const result = formatEmbedDescription(longDesc);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.DESCRIPTION);
  });
});

describe('formatEmbedFieldName', () => {
  it('should format normal field name', () => {
    const name = 'Build Status';
    expect(formatEmbedFieldName(name)).toBe(name);
  });

  it('should truncate long field names', () => {
    const longName = 'A'.repeat(300);
    const result = formatEmbedFieldName(longName);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.FIELD_NAME);
  });
});

describe('formatEmbedFieldValue', () => {
  it('should format normal field value', () => {
    const value = 'SUCCESS';
    expect(formatEmbedFieldValue(value)).toBe(value);
  });

  it('should truncate long field values', () => {
    const longValue = 'A'.repeat(1100);
    const result = formatEmbedFieldValue(longValue);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.FIELD_VALUE);
  });
});

describe('formatEmbedFooter', () => {
  it('should format normal footer', () => {
    const footer = 'TeamCity Build Notification';
    expect(formatEmbedFooter(footer)).toBe(footer);
  });

  it('should truncate long footers', () => {
    const longFooter = 'A'.repeat(2100);
    const result = formatEmbedFooter(longFooter);
    expect(result.length).toBeLessThanOrEqual(DISCORD_LIMITS.FOOTER_TEXT);
  });
});

describe('formatUrl', () => {
  it('should format valid HTTP URLs', () => {
    const url = 'http://localhost:8111/build/123';
    expect(formatUrl(url)).toBe(url);
  });

  it('should format valid HTTPS URLs', () => {
    const url = 'https://teamcity.example.com/build/123';
    expect(formatUrl(url)).toBe(url);
  });

  it('should handle relative URLs', () => {
    const url = '/app/rest/builds/id:901';
    expect(formatUrl(url)).toBe(url);
  });

  it('should return empty string for invalid URLs', () => {
    expect(formatUrl('not-a-url')).toBe('not-a-url'); // Relative URLs are allowed
    expect(formatUrl('http://')).toBe(''); // Invalid URL
    expect(formatUrl('')).toBe('');
  });

  it('should handle invalid inputs', () => {
    expect(formatUrl(null as any)).toBe('');
    expect(formatUrl(undefined as any)).toBe('');
    expect(formatUrl(123 as any)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(formatUrl('  http://example.com  ')).toBe('http://example.com');
  });
});

describe('makeSafeForDiscord', () => {
  it('should escape Discord markdown characters', () => {
    expect(makeSafeForDiscord('*bold*')).toBe('\\*bold\\*');
    expect(makeSafeForDiscord('_italic_')).toBe('\\_italic\\_');
    expect(makeSafeForDiscord('`code`')).toBe('\\`code\\`');
    expect(makeSafeForDiscord('~~strikethrough~~')).toBe('\\~\\~strikethrough\\~\\~');
    expect(makeSafeForDiscord('||spoiler||')).toBe('\\|\\|spoiler\\|\\|');
    expect(makeSafeForDiscord('\\backslash')).toBe('\\\\backslash');
  });

  it('should remove control characters', () => {
    const input = 'Hello\x00World\x1F';
    expect(makeSafeForDiscord(input)).toBe('Hello World');
  });

  it('should trim whitespace', () => {
    expect(makeSafeForDiscord('  Hello World  ')).toBe('Hello World');
  });

  it('should handle complex text', () => {
    const input = '  *Build* `SUCCESS` with _special_ chars\x00  ';
    const expected = '\\*Build\\* \\`SUCCESS\\` with \\_special\\_ chars';
    expect(makeSafeForDiscord(input)).toBe(expected);
  });

  it('should handle invalid inputs', () => {
    expect(makeSafeForDiscord(null as any)).toBe('');
    expect(makeSafeForDiscord(undefined as any)).toBe('');
    expect(makeSafeForDiscord(123 as any)).toBe('');
  });
});