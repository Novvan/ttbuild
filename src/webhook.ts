import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { CONFIG } from './config.js';
import { buildWebSocketEventEmbed } from './embedbuilder.js';
import { createTeamCityEmbed } from './teamcityEmbeds.js';
import { isTeamCityWebhookEvent } from './types/teamcity.js';
import { validateWebhookEvent, validateTeamCityEvent, sanitizeTeamCityEvent, formatValidationErrors } from './utils/validation.js';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';

export function createWebhookApp(bot: Client) {
  const app = express();
  const PORT = CONFIG.WEBHOOK_PORT;

  app.use(bodyParser.json());

  // Process webhook events with enhanced TeamCity support and validation
  app.post(CONFIG.WEBHOOK_ROUTE, async (req: Request, res: Response) => {
    const startTime = Date.now();
    let embed: EmbedBuilder | null = null;
    
    try {
      console.log('Received webhook event:', {
        eventType: req.body?.eventType,
        payloadKeys: req.body?.payload ? Object.keys(req.body.payload) : [],
        timestamp: new Date().toISOString()
      });

      // Validate basic webhook structure
      const basicValidation = validateWebhookEvent(req.body);
      if (!basicValidation.isValid) {
        console.error('Basic webhook validation failed:', formatValidationErrors(basicValidation));
        res.status(400).json({ 
          error: 'Invalid webhook structure', 
          details: formatValidationErrors(basicValidation) 
        });
        return;
      }

      // Log warnings if any
      if (basicValidation.warnings.length > 0) {
        console.warn('Webhook validation warnings:', basicValidation.warnings);
      }
      
      // Try to create specialized TeamCity embed first
      if (isTeamCityWebhookEvent(req.body)) {
        console.log('Processing as TeamCity event:', req.body.eventType);
        
        // Validate TeamCity-specific structure
        const teamCityValidation = validateTeamCityEvent(req.body);
        if (!teamCityValidation.isValid) {
          console.error('TeamCity validation failed:', formatValidationErrors(teamCityValidation));
          // Try to sanitize and continue
          const sanitizedEvent = sanitizeTeamCityEvent(req.body);
          console.log('Attempting to process with sanitized event');
          embed = createTeamCityEmbed(sanitizedEvent);
        } else {
          // Log warnings if any
          if (teamCityValidation.warnings.length > 0) {
            console.warn('TeamCity validation warnings:', teamCityValidation.warnings);
          }
          embed = createTeamCityEmbed(req.body);
        }
        
        if (embed) {
          console.log('Created specialized TeamCity embed');
        } else {
          console.log('Specialized embed creation failed, falling back to generic builder');
          embed = buildWebSocketEventEmbed(req.body);
        }
      } else {
        console.log('Processing as generic webhook event');
        embed = buildWebSocketEventEmbed(req.body);
      }
      
      // Ensure we have an embed
      if (!embed) {
        console.error('Failed to create any embed, creating minimal fallback');
        embed = new EmbedBuilder()
          .setTitle('Webhook Event Received')
          .setDescription(`Event Type: ${req.body?.eventType || 'Unknown'}`)
          .setColor(0xFF0000)
          .setTimestamp(new Date())
          .setFooter({ text: 'Fallback Notification' });
      }

      // Send response immediately
      res.sendStatus(200);

      // Send embed to Discord channel
      const channel = bot.channels.cache.get(CONFIG.WEBHOOK_NOTIFICATIONS_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [embed] });
        const processingTime = Date.now() - startTime;
        console.log(`Embed sent to Discord channel successfully (${processingTime}ms)`);
      } else {
        console.error('Notification channel not found or not text-based.');
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Error processing webhook event:', {
        error: error instanceof Error ? error.message : String(error),
        eventType: req.body?.eventType,
        processingTime: `${processingTime}ms`,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Try to send a fallback embed on error
      try {
        const fallbackEmbed = new EmbedBuilder()
          .setTitle('⚠️ Webhook Processing Error')
          .setDescription(`Failed to process ${req.body?.eventType || 'unknown'} event`)
          .setColor(0xFF0000)
          .setTimestamp(new Date())
          .setFooter({ text: 'Error Notification' });

        const channel = bot.channels.cache.get(CONFIG.WEBHOOK_NOTIFICATIONS_CHANNEL_ID);
        if (channel && channel.isTextBased()) {
          await (channel as TextChannel).send({ embeds: [fallbackEmbed] });
          console.log('Error notification sent successfully');
        }
      } catch (fallbackError) {
        console.error('Fallback error notification also failed:', fallbackError);
      }
      
      // Only send error response if we haven't already sent 200
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error processing webhook',
          eventType: req.body?.eventType 
        });
      }
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
  });

  return { app, server };
}
