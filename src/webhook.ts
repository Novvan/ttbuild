import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { CONFIG } from './config.js';
import { buildWebSocketEventEmbed } from './embedbuilder.js';
import { Client, TextChannel } from 'discord.js';

export function createWebhookApp(bot: Client) {
  const app = express();
  const PORT = CONFIG.WEBHOOK_PORT;

  app.use(bodyParser.json());

  // Validate against your WebSocketEvent type at runtime
  app.post(CONFIG.WEBHOOK_ROUTE, async (req: Request, res: Response) => {
    try {
      console.log(req.body);      
      const embed = buildWebSocketEventEmbed(req.body);
      res.sendStatus(200);

      const channel = bot.channels.cache.get(CONFIG.WEBHOOK_NOTIFICATIONS_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [embed] });
      } else {
        console.error('Notification channel not found or not text-based.');
      }
    } catch (e) {
      console.error('Invalid payload for WebSocketEvent:', e);
      res.status(400).send('Invalid WebSocketEvent payload');
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
  });

  return { app, server };
}
