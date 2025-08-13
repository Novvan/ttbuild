// src/embedBuilder.ts
import { EmbedBuilder } from 'discord.js';

export function buildWebSocketEventEmbed(event:any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Webhook Event: ${event.eventType}`)
    .setColor(0x00AE86)
    .setTimestamp(new Date())
    .setFooter({ text: 'Webhook Notification' });

  // Flatten payload for easy display
  if (event.payload && typeof event.payload === 'object') {
    Object.entries(event.payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        embed.addFields({
          name: key,
          value: String(value),
          inline: true
        });
      }
    });
  }

  return embed;
}
