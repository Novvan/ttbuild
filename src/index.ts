import 'dotenv/config';
import { createWebhookApp } from './webhook.js';
import { startBot } from './bot.js';

async function main() {
  const bot = await startBot();
  createWebhookApp(bot);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
