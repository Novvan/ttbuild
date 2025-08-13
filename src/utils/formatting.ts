// src/utils/formatting.ts

/**
 * Utility functions for formatting TeamCity data for Discord embeds
 */

/**
 * Parse TeamCity timestamp format (e.g., "20250812T000012-0300") to Date object
 * @param teamcityTimestamp - TeamCity timestamp string
 * @returns Date object or null if invalid
 */
export function parseTeamCityTimestamp(teamcityTimestamp: string): Date | null {
  if (!teamcityTimestamp || typeof teamcityTimestamp !== 'string') {
    return null;
  }

  // TeamCity format: YYYYMMDDTHHMMSS±HHMM
  const match = teamcityTimestamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})([+-]\d{4})$/);
  
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, timezone] = match;
  
  // Validate date components
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const hourNum = parseInt(hour, 10);
  const minuteNum = parseInt(minute, 10);
  const secondNum = parseInt(second, 10);

  // Basic validation
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || 
      hourNum > 23 || minuteNum > 59 || secondNum > 59) {
    return null;
  }

  // Create ISO string format
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone.slice(0, 3)}:${timezone.slice(3)}`;
  
  const date = new Date(isoString);
  
  // Additional validation: check if the date is valid and matches input
  if (isNaN(date.getTime()) || 
      date.getFullYear() !== yearNum ||
      date.getMonth() !== monthNum - 1 ||
      date.getDate() !== dayNum) {
    return null;
  }
  
  return date;
}

/**
 * Format a Date object to a human-readable string for Discord
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDateForDiscord(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Format TeamCity timestamp directly to Discord-friendly format
 * @param teamcityTimestamp - TeamCity timestamp string
 * @returns Formatted date string or "Invalid date" if parsing fails
 */
export function formatTeamCityTimestamp(teamcityTimestamp: string): string {
  const date = parseTeamCityTimestamp(teamcityTimestamp);
  return date ? formatDateForDiscord(date) : 'Invalid date';
}

/**
 * Calculate elapsed time from seconds to human-readable format
 * @param seconds - Number of elapsed seconds
 * @returns Human-readable duration string
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 0) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
}

/**
 * Calculate estimated completion time based on elapsed and total estimated seconds
 * @param elapsedSeconds - Seconds already elapsed
 * @param estimatedTotalSeconds - Total estimated seconds for completion
 * @returns Estimated remaining time string
 */
export function formatEstimatedCompletion(elapsedSeconds: number, estimatedTotalSeconds: number): string {
  if (estimatedTotalSeconds <= 0 || elapsedSeconds < 0) {
    return 'Unknown';
  }

  const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
  
  if (remainingSeconds === 0) {
    return 'Completing...';
  }

  return formatElapsedTime(remainingSeconds);
}

/**
 * Calculate duration between two TeamCity timestamps
 * @param startTimestamp - Start timestamp in TeamCity format
 * @param endTimestamp - End timestamp in TeamCity format
 * @returns Duration string or null if invalid timestamps
 */
export function calculateDuration(startTimestamp: string, endTimestamp: string): string | null {
  const startDate = parseTeamCityTimestamp(startTimestamp);
  const endDate = parseTeamCityTimestamp(endTimestamp);

  if (!startDate || !endDate) {
    return null;
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const durationSeconds = Math.floor(durationMs / 1000);

  return formatElapsedTime(durationSeconds);
}