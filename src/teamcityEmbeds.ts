// src/teamcityEmbeds.ts
import { EmbedBuilder } from 'discord.js';
import { TeamCityWebhookEvent, hasRunningInfo, hasAgent, hasLastChanges, hasCanceledInfo } from './types/teamcity.js';
import {
  formatTeamCityTimestamp,
  formatElapsedTime,
  formatEstimatedCompletion,
  calculateDuration
} from './utils/formatting.js';

/**
 * Helper function to safely format TeamCity timestamps
 * @param timestamp - TeamCity timestamp string
 * @returns Formatted timestamp or null if invalid
 */
function safeFormatTimestamp(timestamp: string): string | null {
  const formatted = formatTeamCityTimestamp(timestamp);
  return formatted !== 'Invalid date' ? formatted : null;
}
import {
  formatEmbedTitle,
  formatEmbedFieldName,
  formatEmbedFieldValue,
  formatUrl
} from './utils/text.js';

/**
 * Create a Discord embed for BUILD_STARTED TeamCity events
 * 
 * This function creates a specialized Discord embed for TeamCity BUILD_STARTED events,
 * featuring a blue color scheme with rocket icon, progress information, and estimated
 * completion time when available.
 * 
 * @param event - TeamCity webhook event with BUILD_STARTED eventType
 * @returns Discord embed builder configured for build start notifications
 * 
 * @example
 * ```typescript
 * const embed = buildStartedEmbed(buildStartedEvent);
 * await channel.send({ embeds: [embed] });
 * ```
 * 
 * @since 1.0.0
 */
export function buildStartedEmbed(event: TeamCityWebhookEvent): EmbedBuilder {
  const { payload } = event;
  const { buildType } = payload;

  // Create the embed with blue color scheme and rocket icon
  const embed = new EmbedBuilder()
    .setTitle(formatEmbedTitle(`🚀 Build Started: ${buildType.name}`))
    .setColor(0x3498DB) // Blue color
    .setTimestamp(new Date())
    .setFooter({ text: 'TeamCity Build Notification' });

  // Add project and build information prominently
  embed.addFields({
    name: formatEmbedFieldName('Project'),
    value: formatEmbedFieldValue(buildType.projectName),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Type'),
    value: formatEmbedFieldValue(buildType.name),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Number'),
    value: formatEmbedFieldValue(`#${payload.number}`),
    inline: true
  });

  // Add build status
  embed.addFields({
    name: formatEmbedFieldName('Status'),
    value: formatEmbedFieldValue(payload.statusText || payload.state),
    inline: true
  });

  // Add agent information if available
  if (hasAgent(payload)) {
    embed.addFields({
      name: formatEmbedFieldName('Agent'),
      value: formatEmbedFieldValue(payload.agent.name),
      inline: true
    });
  }

  // Add progress and timing information from running-info
  if (hasRunningInfo(payload)) {
    const runningInfo = payload['running-info'];

    // Progress percentage
    embed.addFields({
      name: formatEmbedFieldName('Progress'),
      value: formatEmbedFieldValue(`${runningInfo.percentageComplete}%`),
      inline: true
    });

    // Estimated completion time
    const estimatedCompletion = formatEstimatedCompletion(
      runningInfo.elapsedSeconds,
      runningInfo.estimatedTotalSeconds
    );
    embed.addFields({
      name: formatEmbedFieldName('Est. Time Remaining'),
      value: formatEmbedFieldValue(estimatedCompletion),
      inline: true
    });

    // Current stage if available
    if (runningInfo.currentStageText && runningInfo.currentStageText.trim()) {
      embed.addFields({
        name: formatEmbedFieldName('Current Stage'),
        value: formatEmbedFieldValue(runningInfo.currentStageText),
        inline: false
      });
    }
  }

  // Add start time if available
  if (payload.startDate) {
    const startTime = safeFormatTimestamp(payload.startDate);
    if (startTime) {
      embed.addFields({
        name: formatEmbedFieldName('Started At'),
        value: formatEmbedFieldValue(startTime),
        inline: true
      });
    }
  }

  // Add clickable link to TeamCity build URL
  const buildUrl = formatUrl(payload.webUrl);
  if (buildUrl) {
    embed.addFields({
      name: formatEmbedFieldName('TeamCity Link'),
      value: formatEmbedFieldValue(`[View Build](${buildUrl})`),
      inline: false
    });
  }

  return embed;
}

/**
 * Create a Discord embed for BUILD_FINISHED TeamCity events
 * 
 * This function creates a specialized Discord embed for TeamCity BUILD_FINISHED events,
 * featuring status-based colors (green for success, red for failure), build duration
 * calculation, and last changes information when available.
 * 
 * @param event - TeamCity webhook event with BUILD_FINISHED eventType
 * @returns Discord embed builder configured for build completion notifications
 * 
 * @example
 * ```typescript
 * const embed = buildFinishedEmbed(buildFinishedEvent);
 * await channel.send({ embeds: [embed] });
 * ```
 * 
 * @since 1.0.0
 */
export function buildFinishedEmbed(event: TeamCityWebhookEvent): EmbedBuilder {
  const { payload } = event;
  const { buildType } = payload;

  // Determine color and icon based on build status
  const isSuccess = payload.status === 'SUCCESS';
  const color = isSuccess ? 0x27AE60 : 0xE74C3C; // Green for success, red for failure
  const icon = isSuccess ? '✅' : '❌';

  // Create the embed with status-based color scheme
  const embed = new EmbedBuilder()
    .setTitle(formatEmbedTitle(`${icon} Build Finished: ${buildType.name}`))
    .setColor(color)
    .setTimestamp(new Date())
    .setFooter({ text: 'TeamCity Build Notification' });

  // Add project and build information prominently
  embed.addFields({
    name: formatEmbedFieldName('Project'),
    value: formatEmbedFieldValue(buildType.projectName),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Type'),
    value: formatEmbedFieldValue(buildType.name),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Number'),
    value: formatEmbedFieldValue(`#${payload.number}`),
    inline: true
  });

  // Add final build status
  embed.addFields({
    name: formatEmbedFieldName('Final Status'),
    value: formatEmbedFieldValue(payload.statusText || payload.status),
    inline: true
  });

  // Add agent information if available
  if (hasAgent(payload)) {
    embed.addFields({
      name: formatEmbedFieldName('Agent'),
      value: formatEmbedFieldValue(payload.agent.name),
      inline: true
    });
  }

  // Calculate and display build duration
  if (payload.startDate && payload.finishDate) {
    const duration = calculateDuration(payload.startDate, payload.finishDate);
    if (duration) {
      embed.addFields({
        name: formatEmbedFieldName('Build Duration'),
        value: formatEmbedFieldValue(duration),
        inline: true
      });
    }
  }

  // Add finish time
  if (payload.finishDate) {
    const finishTime = safeFormatTimestamp(payload.finishDate);
    if (finishTime) {
      embed.addFields({
        name: formatEmbedFieldName('Finished At'),
        value: formatEmbedFieldValue(finishTime),
        inline: true
      });
    }
  }

  // Add last changes information when available
  if (hasLastChanges(payload)) {
    const lastChanges = payload.lastChanges;
    const changeCount = lastChanges.count;

    if (changeCount === 1) {
      const change = lastChanges.change[0];
      const changeDate = safeFormatTimestamp(change.date);
      const changeInfo = changeDate 
        ? `${change.username} (${changeDate})`
        : change.username;
      embed.addFields({
        name: formatEmbedFieldName('Last Change'),
        value: formatEmbedFieldValue(changeInfo),
        inline: false
      });
    } else if (changeCount > 1) {
      const latestChange = lastChanges.change[0];
      const changeInfo = `${changeCount} changes, latest by ${latestChange.username}`;
      embed.addFields({
        name: formatEmbedFieldName('Changes'),
        value: formatEmbedFieldValue(changeInfo),
        inline: false
      });
    }
  }

  // Add clickable link to TeamCity build URL
  const buildUrl = formatUrl(payload.webUrl);
  if (buildUrl) {
    embed.addFields({
      name: formatEmbedFieldName('TeamCity Link'),
      value: formatEmbedFieldValue(`[View Build](${buildUrl})`),
      inline: false
    });
  }

  return embed;
}
/**

 * Create a Discord embed for BUILD_INTERRUPTED TeamCity events
 * 
 * This function creates a specialized Discord embed for TeamCity BUILD_INTERRUPTED events,
 * featuring an orange color scheme with warning icon, cancellation information including
 * the user who canceled and reason, and elapsed time before interruption.
 * 
 * @param event - TeamCity webhook event with BUILD_INTERRUPTED eventType
 * @returns Discord embed builder configured for build interruption notifications
 * 
 * @example
 * ```typescript
 * const embed = buildInterruptedEmbed(buildInterruptedEvent);
 * await channel.send({ embeds: [embed] });
 * ```
 * 
 * @since 1.0.0
 */
export function buildInterruptedEmbed(event: TeamCityWebhookEvent): EmbedBuilder {
  const { payload } = event;
  const { buildType } = payload;

  // Create the embed with orange color scheme and warning icon
  const embed = new EmbedBuilder()
    .setTitle(formatEmbedTitle(`⚠️ Build Interrupted: ${buildType.name}`))
    .setColor(0xF39C12) // Orange color
    .setTimestamp(new Date())
    .setFooter({ text: 'TeamCity Build Notification' });

  // Add project and build information prominently
  embed.addFields({
    name: formatEmbedFieldName('Project'),
    value: formatEmbedFieldValue(buildType.projectName),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Type'),
    value: formatEmbedFieldValue(buildType.name),
    inline: true
  });

  embed.addFields({
    name: formatEmbedFieldName('Build Number'),
    value: formatEmbedFieldValue(`#${payload.number}`),
    inline: true
  });

  // Add build status
  embed.addFields({
    name: formatEmbedFieldName('Status'),
    value: formatEmbedFieldValue(payload.statusText || payload.status),
    inline: true
  });

  // Add agent information if available
  if (hasAgent(payload)) {
    embed.addFields({
      name: formatEmbedFieldName('Agent'),
      value: formatEmbedFieldValue(payload.agent.name),
      inline: true
    });
  }

  // Add cancellation information if available
  if (hasCanceledInfo(payload)) {
    const canceledInfo = payload.canceledInfo;

    // Cancellation reason
    if (canceledInfo.text && canceledInfo.text.trim()) {
      embed.addFields({
        name: formatEmbedFieldName('Cancellation Reason'),
        value: formatEmbedFieldValue(canceledInfo.text.trim()),
        inline: false
      });
    }

    // User who canceled
    embed.addFields({
      name: formatEmbedFieldName('Canceled By'),
      value: formatEmbedFieldValue(canceledInfo.user.username),
      inline: true
    });

    // Cancellation time
    const cancelTime = safeFormatTimestamp(canceledInfo.timestamp);
    if (cancelTime) {
      embed.addFields({
        name: formatEmbedFieldName('Canceled At'),
        value: formatEmbedFieldValue(cancelTime),
        inline: true
      });
    }
  }

  // Show elapsed time before interruption
  if (payload.startDate) {
    let elapsedTime: string | null = null;

    // Try to get elapsed time from running-info first
    if (hasRunningInfo(payload)) {
      elapsedTime = formatElapsedTime(payload['running-info'].elapsedSeconds);
    } else if (hasCanceledInfo(payload)) {
      // Calculate elapsed time from start to cancellation
      elapsedTime = calculateDuration(payload.startDate, payload.canceledInfo.timestamp);
    }

    if (elapsedTime) {
      embed.addFields({
        name: formatEmbedFieldName('Elapsed Time'),
        value: formatEmbedFieldValue(elapsedTime),
        inline: true
      });
    }
  }

  // Add current stage text from running-info if available
  if (hasRunningInfo(payload)) {
    const runningInfo = payload['running-info'];

    if (runningInfo.currentStageText && runningInfo.currentStageText.trim()) {
      embed.addFields({
        name: formatEmbedFieldName('Current Stage'),
        value: formatEmbedFieldValue(runningInfo.currentStageText),
        inline: false
      });
    }
  }

  // Add start time if available
  if (payload.startDate) {
    const startTime = formatTeamCityTimestamp(payload.startDate);
    embed.addFields({
      name: formatEmbedFieldName('Started At'),
      value: formatEmbedFieldValue(startTime),
      inline: true
    });
  }

  // Add clickable link to TeamCity build URL
  const buildUrl = formatUrl(payload.webUrl);
  if (buildUrl) {
    embed.addFields({
      name: formatEmbedFieldName('TeamCity Link'),
      value: formatEmbedFieldValue(`[View Build](${buildUrl})`),
      inline: false
    });
  }

  return embed;
}
/**
 * Factory function to create appropriate Discord embed based on TeamCity event type
 * 
 * This is the main entry point for creating specialized TeamCity Discord embeds.
 * It automatically routes events to the appropriate specialized embed builder based
 * on the eventType. Returns null for unknown event types to allow fallback to
 * the generic embed builder.
 * 
 * Supported event types:
 * - BUILD_STARTED: Blue embed with progress information
 * - BUILD_FINISHED: Green/red embed with duration and completion info
 * - BUILD_INTERRUPTED: Orange embed with cancellation details
 * 
 * @param event - TeamCity webhook event to process
 * @returns Discord embed builder for the event, or null if event type is unsupported
 * 
 * @example
 * ```typescript
 * // Try specialized embed first, fall back to generic if needed
 * const embed = createTeamCityEmbed(webhookEvent) || buildWebSocketEventEmbed(webhookEvent);
 * await channel.send({ embeds: [embed] });
 * ```
 * 
 * @since 1.0.0
 */
export function createTeamCityEmbed(event: TeamCityWebhookEvent): EmbedBuilder | null {
  try {
    // Validate event structure
    if (!event || !event.eventType || !event.payload) {
      console.error('Invalid TeamCity event structure:', {
        hasEvent: !!event,
        hasEventType: !!(event?.eventType),
        hasPayload: !!(event?.payload)
      });
      return null;
    }

    // Validate required payload fields
    const payload = event.payload;
    if (!payload.buildType || !payload.buildType.name || !payload.buildType.projectName) {
      console.error('Missing required buildType information:', {
        hasBuildType: !!payload.buildType,
        hasBuildTypeName: !!(payload.buildType?.name),
        hasProjectName: !!(payload.buildType?.projectName)
      });
      return null;
    }

    switch (event.eventType) {
      case 'BUILD_STARTED':
        console.log('Creating BUILD_STARTED embed');
        return buildStartedEmbed(event);

      case 'BUILD_FINISHED':
        console.log('Creating BUILD_FINISHED embed');
        return buildFinishedEmbed(event);

      case 'BUILD_INTERRUPTED':
        console.log('Creating BUILD_INTERRUPTED embed');
        return buildInterruptedEmbed(event);

      default:
        console.log(`Unknown TeamCity event type: ${event.eventType}`);
        return null;
    }
  } catch (error) {
    console.error('Error creating TeamCity embed:', {
      error: error instanceof Error ? error.message : String(error),
      eventType: event?.eventType,
      buildId: event?.payload?.id,
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}