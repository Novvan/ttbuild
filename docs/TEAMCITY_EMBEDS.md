# TeamCity Discord Embeds

This document describes the enhanced TeamCity webhook integration for Discord, providing specialized embed builders for different TeamCity event types.

## Overview

The system provides specialized Discord embeds for TeamCity webhook events while maintaining full backward compatibility with existing generic webhook processing.

## Features

### Specialized TeamCity Embeds

- **BUILD_STARTED**: Blue embeds with progress information and estimated completion time
- **BUILD_FINISHED**: Status-based colored embeds (green/red) with build duration and changes
- **BUILD_INTERRUPTED**: Orange embeds with cancellation details and elapsed time

### Enhanced Generic Embed Builder

- Improved formatting for nested objects and arrays
- Context-aware field formatting (URLs, timestamps, booleans)
- Respect for Discord embed limits
- Graceful handling of large or complex payloads

### Robust Error Handling

- Comprehensive input validation
- Graceful degradation from specialized to generic embeds
- Detailed logging for troubleshooting
- Fallback mechanisms for malformed data

## Usage

### Automatic Processing

The webhook processor automatically detects TeamCity events and routes them to appropriate embed builders:

```typescript
// In webhook.ts - this happens automatically
if (isTeamCityWebhookEvent(req.body)) {
  const embed = createTeamCityEmbed(req.body) || buildWebSocketEventEmbed(req.body);
} else {
  const embed = buildWebSocketEventEmbed(req.body);
}
```

### Manual Usage

You can also use the embed builders directly:

```typescript
import { createTeamCityEmbed, buildStartedEmbed, buildFinishedEmbed, buildInterruptedEmbed } from './teamcityEmbeds.js';

// Factory function (recommended)
const embed = createTeamCityEmbed(teamcityEvent);

// Direct usage
const startedEmbed = buildStartedEmbed(buildStartedEvent);
const finishedEmbed = buildFinishedEmbed(buildFinishedEvent);
const interruptedEmbed = buildInterruptedEmbed(buildInterruptedEvent);
```

## Event Type Support

### BUILD_STARTED Events

- **Color**: Blue (#3498DB)
- **Icon**: 🚀
- **Key Information**:
  - Project and build type
  - Build number and status
  - Agent information
  - Progress percentage
  - Estimated completion time
  - Current build stage (if available)

### BUILD_FINISHED Events

- **Color**: Green (#27AE60) for success, Red (#E74C3C) for failure
- **Icon**: ✅ for success, ❌ for failure
- **Key Information**:
  - Final build status
  - Build duration (calculated from start/finish times)
  - Agent information
  - Last changes information
  - Completion timestamp

### BUILD_INTERRUPTED Events

- **Color**: Orange (#F39C12)
- **Icon**: ⚠️
- **Key Information**:
  - Cancellation reason and user
  - Elapsed time before interruption
  - Current stage at time of cancellation
  - Cancellation timestamp

## Backward Compatibility

### Existing Functionality Preserved

- All existing webhook events continue to work unchanged
- Generic embed builder maintains original behavior for non-TeamCity events
- Function signatures remain the same
- No breaking changes to existing integrations

### Migration Path

No migration is required. The system automatically:

1. Detects TeamCity events and uses specialized embeds
2. Falls back to generic embeds for unknown TeamCity event types
3. Uses generic embeds for all non-TeamCity events
4. Handles malformed or incomplete data gracefully

## Configuration

No additional configuration is required. The system uses existing webhook configuration:

- `CONFIG.WEBHOOK_PORT`: Webhook server port
- `CONFIG.WEBHOOK_ROUTE`: Webhook endpoint path
- `CONFIG.WEBHOOK_NOTIFICATIONS_CHANNEL_ID`: Discord channel for notifications

## Error Handling

### Validation Levels

1. **Basic Webhook Validation**: Ensures event has required structure
2. **TeamCity Validation**: Validates TeamCity-specific fields
3. **Sanitization**: Provides default values for missing fields
4. **Graceful Degradation**: Falls back to generic embeds on errors

### Logging

The system provides detailed logging for:

- Event type detection
- Validation results
- Embed creation success/failure
- Processing time metrics
- Error details with context

### Fallback Mechanisms

1. **Specialized → Generic**: Failed TeamCity embeds fall back to generic
2. **Generic → Minimal**: Failed generic embeds create minimal error notification
3. **Complete Failure**: System sends error notification to Discord

## Testing

### Test Coverage

- Unit tests for all embed builders
- Integration tests with actual webhook data
- Validation and error handling tests
- Backward compatibility tests
- Performance tests

### Test Data

Tests use actual TeamCity webhook JSON files from `.kiro/webhook_requests/`:

- `BUILD_STARTED.json`
- `BUILD_FINISHED.json`
- `BUILD_INTERRUPTED.json`

## Performance

### Optimizations

- Efficient event type detection
- Lazy loading of specialized builders
- Respect for Discord API limits
- Minimal processing overhead for non-TeamCity events

### Metrics

- Processing time logging
- Memory usage monitoring
- Error rate tracking
- Fallback usage statistics

## Troubleshooting

### Common Issues

1. **Missing Embeds**: Check webhook URL and Discord channel configuration
2. **Generic Instead of Specialized**: Verify event structure matches TeamCity format
3. **Validation Errors**: Check logs for specific validation failures
4. **Performance Issues**: Monitor processing time logs

### Debug Information

Enable detailed logging by checking console output for:

- Event type detection results
- Validation warnings and errors
- Embed creation success/failure
- Processing time metrics

## Future Enhancements

### Planned Features

- Support for additional TeamCity event types
- Customizable embed colors and icons
- Advanced filtering and routing options
- Metrics dashboard integration

### Extension Points

The system is designed for easy extension:

- Add new event types to `createTeamCityEmbed` switch statement
- Create new specialized embed builders following existing patterns
- Extend validation rules in `validation.ts`
- Add new test fixtures for additional event types