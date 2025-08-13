// src/embedBuilder.ts
import { EmbedBuilder } from 'discord.js';
import { 
  formatEmbedTitle, 
  formatEmbedFieldName, 
  formatEmbedFieldValue, 
  formatUrl 
} from './utils/text.js';
import { formatTeamCityTimestamp } from './utils/formatting.js';

/**
 * Enhanced generic embed builder for webhook events with better formatting
 * 
 * This function creates Discord embeds for any webhook event, with enhanced
 * formatting for nested objects, arrays, and special field types. It maintains
 * backward compatibility with the original buildWebSocketEventEmbed function
 * while providing improved handling of complex data structures.
 * 
 * Features:
 * - Intelligent nested object handling with depth limits
 * - Context-aware formatting for URLs, timestamps, and boolean values
 * - Respect for Discord embed field limits (25 fields max)
 * - Priority field ordering for better readability
 * - Graceful handling of circular references and large datasets
 * 
 * @param event - Webhook event object of any type
 * @returns Discord embed builder with formatted event data
 * 
 * @example
 * ```typescript
 * // Works with any webhook event structure
 * const embed = buildWebSocketEventEmbed(webhookEvent);
 * await channel.send({ embeds: [embed] });
 * ```
 * 
 * @since 1.0.0 (enhanced in current version, maintains backward compatibility)
 */
export function buildWebSocketEventEmbed(event: any): EmbedBuilder {
  // Handle null/undefined events gracefully
  if (!event || typeof event !== 'object') {
    const embed = new EmbedBuilder()
      .setTitle(formatEmbedTitle('Webhook Event: Invalid'))
      .setColor(0x00AE86) // Teal color for generic events
      .setTimestamp(new Date())
      .setFooter({ text: 'Webhook Notification' });
    
    embed.addFields({
      name: formatEmbedFieldName('Error'),
      value: formatEmbedFieldValue('Invalid or missing event data'),
      inline: false
    });
    
    return embed;
  }

  const embed = new EmbedBuilder()
    .setTitle(formatEmbedTitle(`Webhook Event: ${event.eventType || 'Unknown'}`))
    .setColor(0x00AE86) // Teal color for generic events
    .setTimestamp(new Date())
    .setFooter({ text: 'Webhook Notification' });

  // Process payload with enhanced formatting
  if (event.payload && typeof event.payload === 'object') {
    try {
      processObjectFields(embed, event.payload, '', 0, new WeakSet());
    } catch (error) {
      // Fallback to simple display on error
      embed.addFields({
        name: formatEmbedFieldName('Payload'),
        value: formatEmbedFieldValue('Error processing payload data'),
        inline: false
      });
    }
  }

  return embed;
}

/**
 * Recursively process object fields with proper formatting and nesting
 * @param embed - Discord embed builder
 * @param obj - Object to process
 * @param prefix - Field name prefix for nested objects
 * @param depth - Current nesting depth
 * @param visited - Set of visited objects to prevent circular references
 */
function processObjectFields(embed: EmbedBuilder, obj: any, prefix: string = '', depth: number = 0, visited: WeakSet<object> = new WeakSet()): void {
  // Limit nesting depth to prevent overly complex embeds
  const MAX_DEPTH = 2;
  const MAX_FIELDS = 20; // Discord limit is 25, leave some room
  
  if (depth > MAX_DEPTH) {
    return;
  }

  // Check for circular references
  if (visited.has(obj)) {
    return;
  }
  visited.add(obj);

  // Get current field count to respect Discord limits
  const currentFields = embed.toJSON().fields?.length || 0;
  if (currentFields >= MAX_FIELDS) {
    return;
  }

  // Priority fields to show first
  const priorityFields = ['id', 'number', 'status', 'state', 'statusText', 'buildType', 'agent'];
  const regularFields: string[] = [];
  
  // Separate priority and regular fields
  Object.keys(obj).forEach(key => {
    if (priorityFields.includes(key)) {
      // Process priority fields first
      processField(embed, obj, key, prefix, depth, visited);
    } else {
      regularFields.push(key);
    }
  });

  // Process regular fields
  regularFields.forEach(key => {
    const currentFieldCount = embed.toJSON().fields?.length || 0;
    if (currentFieldCount < MAX_FIELDS) {
      processField(embed, obj, key, prefix, depth, visited);
    }
  });
}

/**
 * Process individual field with appropriate formatting
 * @param embed - Discord embed builder
 * @param obj - Parent object
 * @param key - Field key
 * @param prefix - Field name prefix
 * @param depth - Current nesting depth
 * @param visited - Set of visited objects to prevent circular references
 */
function processField(embed: EmbedBuilder, obj: any, key: string, prefix: string, depth: number, visited: WeakSet<object>): void {
  const value = obj[key];
  
  if (value === undefined || value === null) {
    return;
  }

  const fieldName = prefix ? `${prefix}.${key}` : key;
  
  // Handle different value types
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Handle nested objects
    if (isSimpleObject(value)) {
      // For simple objects, display as formatted string
      const formattedValue = formatSimpleObject(value);
      if (formattedValue) {
        embed.addFields({
          name: formatEmbedFieldName(formatFieldName(fieldName)),
          value: formatEmbedFieldValue(formattedValue),
          inline: shouldBeInline(key, value)
        });
      }
    } else {
      // For complex objects, recurse with limited depth
      processObjectFields(embed, value, fieldName, depth + 1, visited);
    }
  } else if (Array.isArray(value)) {
    // Handle arrays
    const formattedArray = formatArray(value);
    if (formattedArray) {
      embed.addFields({
        name: formatEmbedFieldName(formatFieldName(fieldName)),
        value: formatEmbedFieldValue(formattedArray),
        inline: false // Arrays are typically not inline
      });
    }
  } else {
    // Handle primitive values
    const formattedValue = formatPrimitiveValue(key, value);
    embed.addFields({
      name: formatEmbedFieldName(formatFieldName(fieldName)),
      value: formatEmbedFieldValue(formattedValue),
      inline: shouldBeInline(key, value)
    });
  }
}

/**
 * Check if an object is simple enough to display inline
 * @param obj - Object to check
 * @returns True if object is simple
 */
function isSimpleObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  const keys = Object.keys(obj);
  return keys.length <= 3 && keys.every(key => 
    typeof obj[key] === 'string' || 
    typeof obj[key] === 'number' || 
    typeof obj[key] === 'boolean'
  );
}

/**
 * Format simple object as a readable string
 * @param obj - Object to format
 * @returns Formatted string
 */
function formatSimpleObject(obj: any): string {
  const entries = Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${formatFieldName(key)}: ${formatPrimitiveValue(key, value)}`);
  
  return entries.join(', ');
}

/**
 * Format array values for display
 * @param arr - Array to format
 * @returns Formatted string
 */
function formatArray(arr: any[]): string {
  if (arr.length === 0) return 'Empty';
  
  // Limit array display to prevent overly long fields
  const MAX_ARRAY_ITEMS = 5;
  const displayItems = arr.slice(0, MAX_ARRAY_ITEMS);
  
  const formatted = displayItems.map(item => {
    if (typeof item === 'object' && item !== null) {
      if (isSimpleObject(item)) {
        return formatSimpleObject(item);
      } else {
        return '[Object]';
      }
    }
    return String(item);
  }).join('\n');
  
  if (arr.length > MAX_ARRAY_ITEMS) {
    return `${formatted}\n... and ${arr.length - MAX_ARRAY_ITEMS} more`;
  }
  
  return formatted;
}

/**
 * Format primitive values with context-aware formatting
 * @param key - Field key for context
 * @param value - Value to format
 * @returns Formatted string
 */
function formatPrimitiveValue(key: string, value: any): string {
  const stringValue = String(value);
  
  // Handle URLs
  if (key.toLowerCase().includes('url') || key.toLowerCase().includes('href')) {
    const url = formatUrl(stringValue);
    return url ? `[Link](${url})` : stringValue;
  }
  
  // Handle timestamps - only for fields that are actually timestamps
  if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) && 
      stringValue.match(/^\d{8}T\d{6}[+-]\d{4}$/)) {
    // Try to format as TeamCity timestamp only if it matches the pattern
    const formatted = formatTeamCityTimestamp(stringValue);
    return formatted !== 'Invalid date' ? formatted : stringValue;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? '✅ Yes' : '❌ No';
  }
  
  return stringValue;
}

/**
 * Format field names to be more readable
 * @param fieldName - Raw field name
 * @returns Formatted field name
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

/**
 * Determine if a field should be displayed inline
 * @param key - Field key
 * @param value - Field value
 * @returns True if field should be inline
 */
function shouldBeInline(key: string, value: any): boolean {
  // Long text fields should not be inline
  const stringValue = String(value);
  if (stringValue.length > 50) {
    return false;
  }
  
  // Certain fields are better displayed inline
  const inlineFields = ['id', 'number', 'status', 'state', 'name', 'username', 'count'];
  return inlineFields.some(field => key.toLowerCase().includes(field.toLowerCase()));
}
