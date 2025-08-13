import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { CONFIG } from './config.js';

export async function startBot() {
  const token = CONFIG.DISCORD_TOKEN!;
  const clientId = CONFIG.DISCORD_CLIENT_ID!;
  const guildId = CONFIG.DISCORD_GUILD_ID ?? null;


  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on(Events.ClientReady, c => {
    console.log(`Bot ready as ${c.user.tag}`);
  });


  await client.login(token);

  return client;
}
