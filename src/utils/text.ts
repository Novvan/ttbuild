// src/utils/text.ts

/**
 * Text utilities for Discord embed formatting and limits
 */

// Discord embed limits
export const DISCORD_LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER_TEXT: 2048,
  AUTHOR_NAME: 256,
  TOTAL_CHARACTERS: 6000
} as const;

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length allowed
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncateLength = Math.max(0, maxLength - suffix.length);
  return text.slice(0, truncateLength) + suffix;
}

/**
 * Sanitize text for Discord embed by removing/replacing problematic characters
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeForDiscord(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Replace null characters and other control characters with spaces
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Replace multiple consecutive whitespace with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Truncate and sanitize text for Discord embed title
 * @param text - Text to process
 * @returns Processed text suitable for Discord embed title
 */
export function formatEmbedTitle(text: string): string {
  const sanitized = sanitizeForDiscord(text);
  return truncateText(sanitized, DISCORD_LIMITS.TITLE);
}

/**
 * Truncate and sanitize text for Discord embed description
 * @param text - Text to process
 * @returns Processed text suitable for Discord embed description
 */
export function formatEmbedDescription(text: string): string {
  const sanitized = sanitizeForDiscord(text);
  return truncateText(sanitized, DISCORD_LIMITS.DESCRIPTION);
}

/**
 * Truncate and sanitize text for Discord embed field name
 * @param text - Text to process
 * @returns Processed text suitable for Discord embed field name
 */
export function formatEmbedFieldName(text: string): string {
  const sanitized = sanitizeForDiscord(text);
  return truncateText(sanitized, DISCORD_LIMITS.FIELD_NAME);
}

/**
 * Truncate and sanitize text for Discord embed field value
 * @param text - Text to process
 * @returns Processed text suitable for Discord embed field value
 */
export function formatEmbedFieldValue(text: string): string {
  const sanitized = sanitizeForDiscord(text);
  return truncateText(sanitized, DISCORD_LIMITS.FIELD_VALUE);
}

/**
 * Truncate and sanitize text for Discord embed footer
 * @param text - Text to process
 * @returns Processed text suitable for Discord embed footer
 */
export function formatEmbedFooter(text: string): string {
  const sanitized = sanitizeForDiscord(text);
  return truncateText(sanitized, DISCORD_LIMITS.FOOTER_TEXT);
}

/**
 * Format a URL to be safe for Discord embeds
 * @param url - URL to format
 * @returns Formatted URL or empty string if invalid
 */
export function formatUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Basic URL validation and formatting
    const trimmed = url.trim();
    
    // If it doesn't start with http/https, assume it's a relative URL
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Validate as URL
    new URL(trimmed);
    return trimmed;
  } catch {
    return '';
  }
}

/**
 * Create a safe string for Discord that won't break formatting
 * @param text - Text to make safe
 * @returns Safe text for Discord
 */
export function makeSafeForDiscord(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Escape Discord markdown characters
    .replace(/([*_`~|\\])/g, '\\$1')
    // Replace control characters with spaces
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Replace multiple consecutive whitespace with single space
    .replace(/\s+/g, ' ')
    .trim();
}